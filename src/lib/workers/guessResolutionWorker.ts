import { redis } from '@/lib/services/redisClient'
import { getPrice } from '@/lib/stores/priceStoreRedis'
import prisma from '@/lib/services/prisma'
import { addGameEvent } from '@/lib/stores/gameStoreRedis'
import { calculateScore } from '@/lib/helpers/scoreStreaksHelper'

const KEY_SCHEDULE = 'game:guess:queue'
const POLL_INTERVAL = 1000 // 1s

const processDue = async () => {
  const now = Date.now()

  const results = await redis
    .multi()
    .zrangebyscore(KEY_SCHEDULE, 0, now)
    .zremrangebyscore(KEY_SCHEDULE, 0, now)
    .exec()

  if (!results || results.length < 1) return

  const rawTasks = Array.isArray(results[0][1]) ? (results[0][1] as string[]) : []

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

      const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: {
          id: true,
          gameConfig: {
            select: {
              scoreStreaksEnabled: true,
              scoreStreakThresholds: true,
            },
          },
        },
      })

      const [updatedGuess, updatedState] = await prisma.$transaction(async tx => {
        const g = await tx.guess.update({
          where: { id },
          data: { outcome },
          select: { id: true, userId: true, gameId: true, outcome: true, timestamp: true },
        })

        const state = await tx.userState.findUnique({
          where: { userId_gameId: { userId: g.userId, gameId: g.gameId } },
          select: { id: true, score: true, streak: true, userId: true, gameId: true },
        })
        if (!state) {
          const created = await tx.userState.create({
            data: { userId: g.userId, gameId: g.gameId, score: 0, streak: 0 },
            select: { id: true, score: true, streak: true, userId: true, gameId: true },
          })
          Object.assign(state ?? {}, created)
        }

        let newStreak = state!.streak
        let delta = 0

        if (outcome) {
          newStreak = (state!.streak ?? 0) + 1
          const enabled = !!game?.gameConfig?.scoreStreaksEnabled
          const thresholds = game?.gameConfig?.scoreStreakThresholds?.trim()
          if (enabled && thresholds) 
            try {
              delta = Math.round(calculateScore(thresholds, newStreak))
            } catch {
              delta = 1
            }
          else 
            delta = 1
          
        } else {
          newStreak = 0
          delta = -1
        }
        const updated = await tx.userState.update({
          where: { userId_gameId: { userId: g.userId, gameId: g.gameId } },
          data: {
            score: { increment: delta },
            streak: newStreak,
          },
          select: { id: true, score: true, streak: true, userId: true, gameId: true },
        })

        return [g, updated] as const
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

setInterval(processDue, POLL_INTERVAL)
