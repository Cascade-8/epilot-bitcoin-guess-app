import WebSocket from 'ws'
import { addPrice } from '@/lib/stores/priceStoreRedis'

const binanceWs = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@aggTrade')

binanceWs.on('open', () => console.log('[BinanceServer] connected'))
binanceWs.on('message', data => {
  try {
    const m = JSON.parse(data.toString())
    const p = parseFloat(m.p || m.data?.p)
    if (!isNaN(p) && !isNaN(m.T)) addPrice(p, m.T)
  } catch { /* ignore */ }
})
binanceWs.on('close', () => console.warn('[BinanceServer] disconnected'))
