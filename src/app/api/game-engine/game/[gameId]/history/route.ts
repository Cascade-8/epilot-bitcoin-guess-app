// src/app/api/game-engine/game/[gameId]/history/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import type { NextRequest } from 'next/server'

export const GET = async(
  _req: NextRequest,
  { params }: { params: { gameId: string } }
) => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) 
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { gameId } = await params

  const history = await prisma.guess.findMany({
    where: { gameId },
    orderBy: { timestamp: 'asc' },
  })
  return NextResponse.json(history)
}
