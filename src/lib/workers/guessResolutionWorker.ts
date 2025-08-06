// src/guessResolutionWorker.ts
import { redis } from '@/lib/services/redisClient'
import { getPrice } from '@/lib/stores/priceStoreRedis'
import prisma from '@/lib/services/prisma'
import { addGameEvent } from '@/lib/stores/gameStoreRedis'

const KEY_SCHEDULE = 'game:guess:queue'
const POLL_INTERVAL = 1000 // 1s

const processDue = async () => {
  const now = Date.now()

  // Execute both commands atomically
  const results = await redis
    .multi()
    .zrangebyscore(KEY_SCHEDULE, 0, now)
    .zremrangebyscore(KEY_SCHEDULE, 0, now)
    .exec()

  // results is Array<[Error|null, any]> or null
  if (!results || results.length < 1) return

  // The first command's reply is at results[0][1]
  const rawTasks = Array.isArray(results[0][1])
    ? (results[0][1] as string[])
    : []

  for (const raw of rawTasks) 
    try {
      const { id, gameId, type, price } = JSON.parse(raw) as {
        id: string
        gameId: string
        type: 'up' | 'down'
        price: number
      }

      const current = await getPrice()
      const outcome =
        current != null
          ? type === 'up'
            ? current.price > price
            : current.price < price
          : false

      const updatedGuess = await prisma.guess.update({
        where: { id },
        data: { outcome },
      })

      const delta = outcome ? 1 : -1
      const updatedState = await prisma.userState.update({
        where: {
          userId_gameId: {
            userId: updatedGuess.userId,
            gameId: updatedGuess.gameId,
          },
        },
        data: { score: { increment: delta } },
      })

      addGameEvent(gameId, updatedGuess.userId, {
        event: 'guess',
        data: updatedGuess,
      })
      addGameEvent(gameId, updatedGuess.userId, {
        event: 'state',
        data: updatedState,
      })
    } catch (err) {
      console.error('Error processing scheduled guess', err)
    }
  
}

// Kick off the worker loop once at startup
setInterval(processDue, POLL_INTERVAL)
