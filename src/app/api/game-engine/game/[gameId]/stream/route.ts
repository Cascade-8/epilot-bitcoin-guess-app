// src/app/api/game-engine/game/[gameId]/stream/route.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { EventEmitter } from 'events'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// one emitter per game
const emitters = new Map<string, EventEmitter>()

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) 
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  

  const { gameId } = await params
  if (!emitters.has(gameId)) 
    emitters.set(gameId, new EventEmitter())
  
  const emitter = emitters.get(gameId)!

  const stream = new ReadableStream({
    async start(controller) {
      const past = await prisma.guess.findMany({
        where: { gameId },
        orderBy: { timestamp: 'asc' },
      })
      for (const g of past) 
        controller.enqueue(`event: guess\ndata: ${JSON.stringify(g)}\n\n`)
      
      const onGuess = (g: any) => {
        controller.enqueue(`event: guess\ndata: ${JSON.stringify(g)}\n\n`)
      }
      emitter.on('guess', onGuess)
      controller.close()
      emitter.off('guess', onGuess)
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
