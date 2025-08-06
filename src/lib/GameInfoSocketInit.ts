// src/lib/GameInfoSocketInit.ts
import { WebSocketServer, type WebSocket as WsWebSocket } from 'ws'
import { decode }        from 'next-auth/jwt'
import { parseChannels,
  flushPending } from './GameInfoSocket'
import { getHistory,
  subscribe }     from './BitcoinPriceStore'
import type { IncomingMessage } from 'http'

declare global {
  // keep a singleton on next’s node process
  // eslint-disable-next-line no-var
  var __gameInfoWSS: WebSocketServer | undefined
}

const WS_PORT = Number(process.env.GAME_INFO_WS_PORT || 3001)
const WS_HOST = process.env.GAME_INFO_WS_HOST || '0.0.0.0'
const JWT_SECRET = process.env.NEXTAUTH_SECRET!
type ExtendedWs = WsWebSocket & {
  channels?: Set<string>
  userId?:   string
}

// simple cookie parser
const parseCookies = (header: string) =>
  header.split(';').reduce<Record<string, string>>((acc, part) => {
    const [k, ...v] = part.trim().split('=')
    acc[k] = decodeURIComponent(v.join('='))
    return acc
  }, {})

// Only initialize once, on the server
if (typeof window === 'undefined' && !global.__gameInfoWSS) {
  const wss = new WebSocketServer({ port: WS_PORT, host: WS_HOST })

  wss.on('connection', (rawWs, req: IncomingMessage) => {
    const ws = rawWs as ExtendedWs

    ;(async () => {
      const cookieHeader = req.headers.cookie
      if (!cookieHeader) return ws.close(1008)

      const cookies = parseCookies(cookieHeader)
      // NextAuth may set either "__Host-next-auth.session-token" or "next-auth.session-token"
      const token =
        cookies['__Host-next-auth.session-token'] ??
        cookies['next-auth.session-token']
      if (!token) return ws.close(1008)

      const payload = await decode({ token, secret: JWT_SECRET })
      if (!payload?.sub) return ws.close(1008)
      ws.userId = payload.sub

      // figure out which channels they asked for
      const requested = parseChannels(req.url)
      const allowed = new Set<string>()

      // bitcoin-price channel example:
      if (requested.has('price:btc')) {
        allowed.add('price:btc')
        // send replay
        getHistory().forEach(rec => {
          ws.send(JSON.stringify({ channel: 'price:btc', type: 'history', ...rec }))
        })
        // subscribe for live updates
        const unsub = subscribe(rec => {
          if (ws.channels?.has('price:btc')) 
            ws.send(JSON.stringify({ channel: 'price:btc', type: 'price', ...rec }))
          
        })
        ws.once('close', unsub)
      }

      // game-specific channels: “game:{configId}:{userId}”
      for (const ch of requested) {
        const [kind, , uid] = ch.split(':')
        if (kind === 'game' && uid === ws.userId) 
          allowed.add(ch)
        
      }

      ws.channels = allowed

      // flush any buffered messages now that the client is set up
      flushPending()
    })().catch(err => {
      console.error('WebSocket auth error', err)
      ws.close(1011)
    })
  })

  global.__gameInfoWSS = wss
  console.log(`🌐 GameInfo WS listening on ${WS_HOST}:${WS_PORT}`)
}
