// app/api/game-engine/stream/route.ts
import '@/lib/bootstrap'
import { NextRequest } from 'next/server'
import { subscribe as subscribePrice } from '@/lib/stores/priceStoreRedis'
import { subscribeGame }                         from '@/lib/stores/gameStoreRedis'

export const runtime = 'nodejs'

export const GET = async (req: NextRequest) => {
  const url      = new URL(req.url)
  const raw      = url.searchParams.get('channels') ?? ''
  const channels = new Set(raw.split(',').filter(Boolean))

  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  const send = (data: any) => {
    writer.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  // PRICE:BTC → only live updates (history via separate endpoint)
  let unsubPrice: (() => void) | undefined
  if (channels.has('price:btc')) 
    unsubPrice = subscribePrice(rec =>
      send({ channel: 'price:btc', type: 'update', ...rec })
    )
  

  // GAME live-only
  const gameUnsubs: (() => void)[] = []
  for (const ch of channels) {
    const [kind, gameId, userId] = ch.split(':')
    if (kind === 'game' && gameId && userId) {
      const unsubG = subscribeGame(gameId, userId, evt =>
        send({ channel: ch, type: 'update', ...evt })
      )
      gameUnsubs.push(unsubG)
    }
  }

  req.signal.addEventListener('abort', () => {
    if (unsubPrice) unsubPrice()
    gameUnsubs.forEach(u => u())
    writer.close()
  })

  return new Response(readable, {
    headers: {
      'Content-Type':        'text/event-stream',
      'Cache-Control':       'no-cache, no-transform',
      Connection:            'keep-alive',
      'X-Accel-Buffering':   'no',
    },
  })
}
