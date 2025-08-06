import { NextResponse } from 'next/server'
import prisma from '@/lib/services/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

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

export const GET = async () => {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  const defaultConfigsPromise = prisma.gameConfig.findMany({
    where: { userId: null },
  })
  const ownedConfigsPromise = userId
    ? prisma.gameConfig.findMany({ where: { userId } })
    : []
  const sharedConfigsPromise = userId
    ? prisma.gameConfig.findMany({
      where: {
        AND: [
          { userId: { not: userId } },
          { userId: { not: null } }
        ],
        games: {
          some: {
            userStates: { some: { userId } },
          },
        },
      },
    })
    : []

  const [defaultConfigs, ownedConfigs, sharedConfigs] = await Promise.all([
    defaultConfigsPromise,
    ownedConfigsPromise,
    sharedConfigsPromise,
  ])

  return NextResponse.json({
    default: defaultConfigs,
    owned: ownedConfigs,
    shared: sharedConfigs,
  })
}

export const POST = async (req: Request) => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) 
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  const userId = session.user.id
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
      { error: `guessingPeriod must be ≥ ${MIN_GUESSING_PERIOD}ms` },
      { status: 400 }
    )
  if (duration !== 0 && duration < guessingPeriod + MIN_DURATION_OFFSET) 
    return NextResponse.json(
      { error: `duration must be 0 or ≥ period + ${MIN_DURATION_OFFSET}ms` },
      { status: 400 }
    )
  if (maxPlayers < 0 || maxPlayers > MAX_PLAYERS) 
    return NextResponse.json(
      { error: `maxPlayers must be between 0 and ${MAX_PLAYERS}` },
      { status: 400 }
    )
  const data: any = {
    name,
    guessingPeriod,
    scoreStreaksEnabled,
    bettingMode,
    maxPlayers,
    duration,
    userId,
  }
  if (scoreStreaksEnabled) 
    data.scoreStreakThresholds = scoreStreakThresholds || ''
  const config = await prisma.gameConfig.create({ data })
  return NextResponse.json(config, { status: 201 })
}
