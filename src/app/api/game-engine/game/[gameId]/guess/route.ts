// src/app/(protected)/game-engine/game/[gameId]/guess/route.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { addGameEvent } from '@/lib/gameStoreRedis'
import { redis } from '@/lib/redisClient'

export const POST = async (
  req: NextRequest,
  context: { params: Promise<{ gameId: string }> }
): Promise<NextResponse> => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) 
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  

  const userId = session.user.id
  const { gameId } = await context.params
  const { type, price, timestamp } = (await req.json()) as {
    type: 'up' | 'down'
    price: number
    timestamp: number
  }
  if (!type || !timestamp) 
    return NextResponse.json(
      { error: 'type, price, and timestamp are required' },
      { status: 400 }
    )
  

  const now = Date.now()
  if (now - timestamp > 2000) 
    return NextResponse.json({ error: 'Stale timestamp' }, { status: 400 })
  

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { gameConfig: true, userStates: true },
  })
  if (!game) 
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  

  const isParticipant = game.userStates.some(s => s.userId === userId)
  const isPublic = !game.private && game.passcode === ''
  if (!isParticipant && !isPublic) 
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  

  // Create the guess in Postgres; guess.timestamp is now a Date object
  const guess = await prisma.guess.create({
    data: {
      userId,
      gameId,
      type,
      price,
      timestamp: new Date(timestamp),              // client number → Date
      period: game.gameConfig.guessingPeriod,      // period in ms
    },
  })

  // Emit the immediate guess event
  addGameEvent(gameId, userId, {
    event: 'guess',
    data: guess,
  })

  // Derive dueTimestamp from the stored Date + period
  const guessTimeMs = guess.timestamp.getTime()
  const dueTimestamp = guessTimeMs + guess.period

  // Enqueue in Redis: score=dueTimestamp, member=task JSON
  await redis.zadd(
    'game:guess:queue',
    dueTimestamp,
    JSON.stringify({ id: guess.id, gameId, type, price })
  )

  return NextResponse.json(guess)
}
