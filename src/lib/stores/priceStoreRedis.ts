/**
 * Price Storage file to store the streamed prices into redit
 */

import Redis from 'ioredis'
import { redis } from '../services/redisClient'

type PriceRecord = { time: number; price: number }

const KEY_HISTORY = 'prices:btc:history:zset'
const PUB_CHANNEL = 'prices:btc:pub'
const TTL_MS = 10 * 60 * 1000  // 10 minutes

const addPrice = async (price: number, time: number) => {
  const rec = JSON.stringify({ time, price })

  await redis
    .multi()
    .zadd(KEY_HISTORY, time, rec)
    .zremrangebyscore(KEY_HISTORY, 0, time - TTL_MS)
    .publish(PUB_CHANNEL, rec)
    .exec()
}

const getHistory = async (): Promise<PriceRecord[]> => {
  const cutoff = Date.now() - TTL_MS
  const entries = await redis.zrangebyscore(KEY_HISTORY, cutoff, '+inf')
  return entries.map(e => JSON.parse(e))
}

/**
 * Get the single most recent price record (or null if none).
 */
const getPrice = async (): Promise<PriceRecord | null> => {
  // ZRANGE with indices -1 to -1 returns the last element by score
  const entries = await redis.zrange(KEY_HISTORY, -1, -1)
  if (entries.length === 0) return null
  try {
    return JSON.parse(entries[0]) as PriceRecord
  } catch {
    return null
  }
}
const subscribe = (fn: (rec: PriceRecord) => void) => {
  const sub = new Redis(process.env.REDIS_URL+'')
  sub.subscribe(PUB_CHANNEL, err => {
    if (err) console.error('Redis subscribe error', err)
  })
  sub.on('message', (_channel, message) => {
    try {
      fn(JSON.parse(message)) 
    } catch {}
  })
  return () => sub.disconnect()
}

export { addPrice, getHistory, subscribe, getPrice }
