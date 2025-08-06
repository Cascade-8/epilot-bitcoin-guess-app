// src/lib/gameStoreRedis.ts
import Redis from 'ioredis'
import { redis } from '../services/redisClient'

type GameEvent = {
  event: string
  data: any
  time: number
}

const PUB_PREFIX = 'game:'

// Publish (emit) a game event
const addGameEvent = async (
  gameId: string,
  userId: string,
  payload: { event: string; data: any }
) => {
  const channel = `${PUB_PREFIX}${gameId}:${userId}`
  const msg = JSON.stringify({ ...payload, time: Date.now() })
  await redis.publish(channel, msg)
}

// Subscribe to live game events (no history)
const subscribeGame = (
  gameId: string,
  userId: string,
  fn: (evt: GameEvent) => void
): (() => void) => {
  const channel = `${PUB_PREFIX}${gameId}:${userId}`
  const sub = new Redis(process.env.REDIS_URL || '')
  sub.subscribe(channel, err => {
    if (err) console.error('Redis subscribe error', err)
  })
  sub.on('message', (_ch, message) => {
    try {
      fn(JSON.parse(message)) 
    } catch {}
  })
  return () => {
    sub.disconnect()
  }
}

export { addGameEvent, subscribeGame }
