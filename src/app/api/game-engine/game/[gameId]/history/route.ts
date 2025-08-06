// src/app/api/game-engine/game/[gameId]/history/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/services/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import type { NextRequest } from 'next/server'

export const GET = async(
  _req: NextRequest,
  context: { params: Promise<{ gameId: string }> }
) => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) 
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { gameId } = await context.params

  const history = await prisma.guess.findMany({
    where: { gameId },
    orderBy: { timestamp: 'asc' },
  })
  return NextResponse.json(history)
}
