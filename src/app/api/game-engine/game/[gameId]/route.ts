// src/app/(protected)/game-engine/game/[gameId]/route.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const GET = async (
  _req: NextRequest,
  { params }: { params: { gameId: string } }
) => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) 
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const userId = session.user.id
  const { gameId } = await params
  // fetch the game with its config and per-user states
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      gameConfig: true,
      userStates: {
        select: { userId: true, score: true, joinedAt: true },
      },
    },
  })
  console.log(game)
  if (!game) 
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  

  // ensure user is allowed to view: either joined or public/no-passcode
  const isParticipant = game.userStates.some(s => s.userId === userId)
  const isPublic = !game.private && game.passcode === ''
  if (!isParticipant && !isPublic) 
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  

  return NextResponse.json(game)
}
