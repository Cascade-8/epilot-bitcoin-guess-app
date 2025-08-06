// src/lib/GameInfoSocket.ts
import WebSocket, { WebSocketServer } from 'ws'

// global singleton slot
declare global {
  // eslint-disable-next-line no-var
  var __gameInfoWSS: WebSocketServer | undefined
}

// your original channel parser (exported so init can use it)
export const parseChannels = (reqUrl?: string): Set<string> => {
  if (!reqUrl) return new Set()
  try {
    const params = new URL(reqUrl, `http://${process.env.BASEURL || 'localhost'}`).searchParams
    const raw    = params.get('channels')
    return raw ? new Set(raw.split(',')) : new Set()
  } catch {
    return new Set()
  }
}

// internal FIFO buffer
const pending: { channel: string; payload: any }[] = []

// grab the singleton (or undefined if not yet created)
const getWSS = (): WebSocketServer | undefined =>
  (global as any).__gameInfoWSS as WebSocketServer | undefined

// arrow-function broadcast: buffer if no server yet
export const broadcast = (channel: string, payload: any): void => {
  const wss = getWSS()
  if (!wss) {
    pending.push({ channel, payload })
    return
  }
  const msg = JSON.stringify({ channel, ...payload })
  wss.clients.forEach(client => {
    const ws = client as WebSocket & { channels?: Set<string> }
    if (ws.readyState === WebSocket.OPEN && ws.channels?.has(channel)) 
      ws.send(msg)
    
  })
}

// flush anything queued once the WSS is live
export const flushPending = (): void => {
  const wss = getWSS()
  if (!wss) return
  pending.forEach(({ channel, payload }) => {
    const msg = JSON.stringify({ channel, ...payload })
    wss.clients.forEach(client => {
      const ws = client as WebSocket & { channels?: Set<string> }
      if (ws.readyState === WebSocket.OPEN && ws.channels?.has(channel)) 
        ws.send(msg)
      
    })
  })
  pending.length = 0
}
