// src/lib/bitcoinPriceSocket.ts
import { WebSocketServer } from 'ws'
import { getHistory, subscribe } from './BitcoinPriceStore'

// Ensure we only ever create one server, even if this module is imported multiple times
declare global {
  // eslint-disable-next-line no-var
  var __bitcoinPriceWSS: WebSocketServer | undefined
}

const PORT = 3001

if (!global.__bitcoinPriceWSS) {
  const wss = new WebSocketServer({ port: PORT })
  wss.on('connection', ws => {
    // Send existing history
    for (const rec of getHistory()) 
      ws.send(JSON.stringify({ type: 'history', time: rec.time, price: rec.price }))
    
    // Subscribe to live updates
    const off = subscribe(rec => {
      ws.send(JSON.stringify({ type: 'price', time: rec.time, price: rec.price }))
    })
    ws.once('close', off)
  })
  console.log(`[BitcoinPriceSocket] listening on ws://localhost:${PORT}`)
  global.__bitcoinPriceWSS = wss
}

export const wss = global.__bitcoinPriceWSS!
