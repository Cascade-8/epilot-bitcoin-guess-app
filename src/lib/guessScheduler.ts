// src/lib/guessScheduler.ts
import prisma from '@/lib/prisma'
import { getPrice } from '@/lib/BitcoinPriceStore'
import { broadcast } from '@/lib/GameInfoSocket'

type Task = {
  id: string
  gameId: string
  due: number
  type: 'up' | 'down'
  price: number
}

const queue: Task[] = []
let started = false

export const scheduleGuessResolution = (task: Task): void => {
  const idx = queue.findIndex(t => t.due > task.due)
  if (idx === -1) queue.push(task)
  else queue.splice(idx, 0, task)

  if (!started) {
    started = true
    setInterval(async () => {
      const now = Date.now()
      while (queue.length && queue[0].due <= now) {
        const { id, gameId, type, price } = queue.shift()!
        const current = getPrice()
        const outcome = current != null
          ? (type === 'up' ? current > price : current < price)
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
            }
          },
          data: { score: { increment: delta } },
        })

        broadcast(`game:${gameId}:${updatedGuess.userId}`, { event: 'guess', data: updatedGuess })
        broadcast(`game:${gameId}:${updatedGuess.userId}`, { event: 'state', data: updatedState })
      }
    }, 1000)
  }
}
