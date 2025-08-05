// src/app/(protected)/game-engine/game/route.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getServerSession } from 'next-auth/next'

export const GET = async (req: NextRequest) => {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  const whereClause = userId
    ? {
      OR: [
        { userStates: { some: { userId } } },
        { private: false, passcode: '' },
      ],
    }
    : { private: false, passcode: '' }

  const games = await prisma.game.findMany({
    where: whereClause,
    include: {
      gameConfig: true,
      userStates: { select: { userId: true, score: true, joinedAt: true } },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(games)
}

export const PATCH = async (req: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) 
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const userId = session.user.id
  const { gameId, passcode } = (await req.json()) as {
    gameId: string
    passcode?: string
  }
  if (!gameId) 
    return NextResponse.json({ error: 'gameId is required' }, { status: 400 })
  

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      gameConfig: true,
      userStates: { select: { userId: true } },
    },
  })
  if (!game) 
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  

  if (game.private && game.passcode !== passcode) 
    return NextResponse.json({ error: 'Invalid passcode' }, { status: 403 })
  

  const currentPlayers = game.userStates.length
  if (game.gameConfig.maxPlayers > 0 && currentPlayers >= game.gameConfig.maxPlayers) 
    return NextResponse.json({ error: 'Game is full' }, { status: 400 })
  

  if (game.userStates.some(s => s.userId === userId)) 
    return NextResponse.json({ error: 'Already joined' }, { status: 400 })
  

  // Create initial state record
  const updatedGame = await prisma.game.update({
    where: { id: gameId },
    data: {
      userStates: {
        create: { userId, score: 0 },
      },
    },
    include: {
      gameConfig: true,
      userStates: { select: { userId: true, score: true, joinedAt: true } },
    },
  })

  return NextResponse.json(updatedGame)
}
