// src/lib/bitcoinPriceStore.ts
import { EventEmitter } from 'events'
import WebSocket from 'ws' // remove this import if you run on Edge

type PriceRecord = { time: number; price: number }

const RETENTION_MS = 10 * 60 * 1000
let prices: PriceRecord[] = []
const emitter = new EventEmitter()
emitter.setMaxListeners(0)

const prune = () => {
  const cutoff = Date.now() - RETENTION_MS
  prices = prices.filter(p => p.time >= cutoff)
}

export const addPrice = (price: number, time: number) => {
  const rec = { time, price }
  prices.push(rec)
  prune()
  emitter.emit('price', rec)
}

export const getHistory = (): PriceRecord[] => {
  prune()
  return prices
}

export const getPrice = () => {
  prune()
  return prices[prices.length - 1]?.price ?? null
}

export const subscribe = (fn: (rec: PriceRecord) => void) => {
  emitter.on('price', fn)
  return () => emitter.off('price', fn)
}

// Directly create the Binance WebSocket on module load
const binanceWs = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@aggTrade')
console.log('[BitcoinPriceStore] module loaded — opening WS…')

binanceWs.on('open', () => {
  console.log('[Binance] connected')
})

binanceWs.on('message', data => {
  try {
    const m = JSON.parse(data.toString())
    const p = parseFloat(m.p || m.data?.p)
    if (!isNaN(p) && !isNaN(m.T)) addPrice(p, m.T)
  } catch {
    // ignore
  }
})

binanceWs.on('close', () => {
  console.warn('[Binance] disconnected')
  // if you want to auto-reconnect, you can instantiate binanceWs again here
})
