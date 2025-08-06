// app/api/game-engine/config/[configId]/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

const MIN_GUESSING_PERIOD = 5000
const MIN_DURATION_OFFSET = 60000
const MAX_PLAYERS = 32

export type ConfigPayload = {
  id?: string
  name: string
  guessingPeriod: number
  scoreStreaksEnabled?: boolean
  scoreStreakThresholds?: string
  bettingMode?: boolean
  maxPlayers?: number
  duration?: number
}

export const DELETE = async (
  req: Request,
  context: { params: Promise<{ configId: string }> }
) => {
  // Auth
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) 
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  
  const userId = session.user.id

  // Params
  const { configId } = await context.params
  if (!configId) 
    return NextResponse.json({ error: 'Missing config id' }, { status: 400 })
  

  // Fetch & ownership check
  const config = await prisma.gameConfig.findUnique({
    where: { id: configId },
    select: { userId: true }
  })
  if (!config) 
    return NextResponse.json({ error: 'Config not found' }, { status: 404 })
  
  if (config.userId !== userId) 
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  

  // Perform delete
  await prisma.gameConfig.delete({ where: { id: configId } })
  // 204 No Content is appropriate here
  return new NextResponse(null, { status: 204 })
}

export const GET = async (
  req: Request,
  context: {
    // <-- mark params as a Promise of the real shape
    params: Promise<{ configId: string }>
  }
) => {
  // 1) auth
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) 
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  
  const userId = session.user.id

  // 2) grab the route param
  const { configId } = await context.params
  if (!configId)
    return NextResponse.json(
      { error: 'Missing config id' },
      { status: 400 }
    )
  

  // 3) fetch config
  const config = await prisma.gameConfig.findUnique({
    where: { id: configId },
  })
  if (!config) 
    return NextResponse.json(
      { error: 'Config not found' },
      { status: 404 }
    )
  

  // 4A) Owner → full access
  if (config.userId === userId) 
    return NextResponse.json(config)
  

  // 4B) Public/default (no owner) → view only
  if (!config.userId) 
    return NextResponse.json(config)
  

  // 4C) Shared-in-game → view only
  const membership = await prisma.userState.findFirst({
    where: {
      userId,
      game: { configId },
    },
  })
  if (membership) 
    return NextResponse.json(config)
  

  // 5) Forbidden
  return NextResponse.json(
    { error: 'Forbidden' },
    { status: 403 }
  )
}

export const PATCH = async (
  req: Request,
  context: {
    // <-- mark params as a Promise of the real shape
    params: Promise<{ configId: string }>
  }
) => {
  const { configId } = await context.params
  const {
    name,
    guessingPeriod,
    scoreStreaksEnabled = false,
    scoreStreakThresholds,
    bettingMode = false,
    maxPlayers = 1,
    duration = 0,
  } = (await req.json()) as ConfigPayload

  if (!configId)
    return NextResponse.json(
      { error: 'Missing config id' },
      { status: 400 }
    )
  

  // Validate guessingPeriod
  if (guessingPeriod < MIN_GUESSING_PERIOD) 
    return NextResponse.json(
      {
        error: `guessingPeriod must be at least ${MIN_GUESSING_PERIOD}ms`,
      },
      { status: 400 }
    )
  

  // Validate duration
  if (duration !== 0 && duration < guessingPeriod + MIN_DURATION_OFFSET) 
    return NextResponse.json(
      {
        error: `duration must be 0 or at least guessingPeriod + ${MIN_DURATION_OFFSET}ms`,
      },
      { status: 400 }
    )
  

  // Validate maxPlayers
  if (maxPlayers < 0 || maxPlayers > MAX_PLAYERS) 
    return NextResponse.json(
      {
        error: `maxPlayers must be between 0 and ${MAX_PLAYERS}`,
      },
      { status: 400 }
    )
  

  // Prepare update payload
  const data: any = {
    name,
    guessingPeriod,
    scoreStreaksEnabled,
    bettingMode,
    maxPlayers,
    duration,
  }
  if (scoreStreaksEnabled) 
    data.scoreStreakThresholds = scoreStreakThresholds || ''
  

  try {
    const updated = await prisma.gameConfig.update({
      where: { id: configId },
      data,
    })
    return NextResponse.json(updated)
  } catch (e: any) {
    console.error(e)
    return NextResponse.json(
      { error: e.message || 'Failed to update config' },
      { status: 500 }
    )
  }
}

export const POST = async (req: Request) => {
  const {
    name,
    guessingPeriod,
    scoreStreaksEnabled = false,
    scoreStreakThresholds,
    bettingMode = false,
    maxPlayers = 1,
    duration = 0,
  } = (await req.json()) as ConfigPayload

  // Validate guessingPeriod
  if (guessingPeriod < MIN_GUESSING_PERIOD) 
    return NextResponse.json(
      { error: `guessingPeriod must be at least ${MIN_GUESSING_PERIOD}ms` },
      { status: 400 }
    )
  

  // Validate duration
  if (duration !== 0 && duration < guessingPeriod + MIN_DURATION_OFFSET) 
    return NextResponse.json(
      {
        error: `duration must be 0 or at least guessingPeriod + ${MIN_DURATION_OFFSET}ms`,
      },
      { status: 400 }
    )
  

  // Validate maxPlayers
  if (maxPlayers < 0 || maxPlayers > MAX_PLAYERS) 
    return NextResponse.json(
      {
        error: `maxPlayers must be between 0 and ${MAX_PLAYERS}`,
      },
      { status: 400 }
    )
  

  // Build create payload
  const data: any = {
    name,
    guessingPeriod,
    scoreStreaksEnabled,
    bettingMode,
    maxPlayers,
    duration,
  }
  if (scoreStreaksEnabled) 
    data.scoreStreakThresholds = scoreStreakThresholds || ''
  

  const config = await prisma.gameConfig.create({ data })
  return NextResponse.json(config, { status: 201 })
}
