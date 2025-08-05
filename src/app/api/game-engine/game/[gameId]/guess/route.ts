// src/app/(protected)/game-engine/game/[gameId]/guess/route.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const POST = async (
  req: NextRequest,
  { params }: { params: { gameId: string } }
) => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  const { gameId } = await params

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
  

  // ensure timestamp is fresh (no older than 2s)
  const now = Date.now()
  if (now - timestamp > 2000) 
    return NextResponse.json(
      { error: 'Stale timestamp' },
      { status: 400 }
    )
  

  // verify game & participation
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
  

  // save the guess with client-provided price & timestamp
  const guess = await prisma.guess.create({
    data: {
      userId,
      gameId,
      type,
      price,
      timestamp: new Date(timestamp),
      period: game.gameConfig.guessingPeriod
    },
  })

  return NextResponse.json(guess)
}
