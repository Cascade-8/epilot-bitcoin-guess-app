import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/services/prisma'

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
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) 
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  
  const userId = session.user.id

  const { configId } = await context.params
  if (!configId) 
    return NextResponse.json({ error: 'Missing config id' }, { status: 400 })

  const config = await prisma.gameConfig.findUnique({
    where: { id: configId },
    select: { userId: true }
  })
  if (!config) 
    return NextResponse.json({ error: 'Config not found' }, { status: 404 })
  
  if (config.userId !== userId) 
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.gameConfig.delete({ where: { id: configId } })
  return new NextResponse(null, { status: 204 })
}

export const GET = async (
  req: Request,
  context: {
    params: Promise<{ configId: string }>
  }
) => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) 
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  
  const userId = session.user.id
  const { configId } = await context.params
  if (!configId)
    return NextResponse.json(
      { error: 'Missing config id' },
      { status: 400 }
    )
  const config = await prisma.gameConfig.findUnique({
    where: { id: configId },
  })
  if (!config) 
    return NextResponse.json(
      { error: 'Config not found' },
      { status: 404 }
    )
  if (config.userId === userId) 
    return NextResponse.json(config)

  if (!config.userId) 
    return NextResponse.json(config)

  const membership = await prisma.userState.findFirst({
    where: {
      userId,
      game: { configId },
    },
  })
  if (membership) 
    return NextResponse.json(config)

  return NextResponse.json(
    { error: 'Forbidden' },
    { status: 403 }
  )
}

export const PATCH = async (
  req: Request,
  context: {
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

  if (guessingPeriod < MIN_GUESSING_PERIOD) 
    return NextResponse.json(
      {
        error: `guessingPeriod must be at least ${MIN_GUESSING_PERIOD}ms`,
      },
      { status: 400 }
    )

  if (duration !== 0 && duration < guessingPeriod + MIN_DURATION_OFFSET) 
    return NextResponse.json(
      {
        error: `duration must be 0 or at least guessingPeriod + ${MIN_DURATION_OFFSET}ms`,
      },
      { status: 400 }
    )

  if (maxPlayers < 0 || maxPlayers > MAX_PLAYERS) 
    return NextResponse.json(
      {
        error: `maxPlayers must be between 0 and ${MAX_PLAYERS}`,
      },
      { status: 400 }
    )

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

  if (guessingPeriod < MIN_GUESSING_PERIOD) 
    return NextResponse.json(
      { error: `guessingPeriod must be at least ${MIN_GUESSING_PERIOD}ms` },
      { status: 400 }
    )

  if (duration !== 0 && duration < guessingPeriod + MIN_DURATION_OFFSET) 
    return NextResponse.json(
      {
        error: `duration must be 0 or at least guessingPeriod + ${MIN_DURATION_OFFSET}ms`,
      },
      { status: 400 }
    )

  if (maxPlayers < 0 || maxPlayers > MAX_PLAYERS) 
    return NextResponse.json(
      {
        error: `maxPlayers must be between 0 and ${MAX_PLAYERS}`,
      },
      { status: 400 }
    )

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
