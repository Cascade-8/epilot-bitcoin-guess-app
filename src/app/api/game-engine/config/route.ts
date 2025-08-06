// app/api/game-engine/config/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
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

// ── GET /api/game-engine/config ──
export const GET = async () => {
  // get current user (if any)
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  // fetch default (public) configs
  const defaultConfigsPromise = prisma.gameConfig.findMany({
    where: { userId: null },
  })

  // fetch owned configs if logged in
  const ownedConfigsPromise = userId
    ? prisma.gameConfig.findMany({ where: { userId } })
    : []

  // fetch shared configs if logged in
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

// ── POST /api/game-engine/config ──

export const POST = async (req: Request) => {
  // 1) Auth
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) 
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  
  const userId = session.user.id

  // 2) Parse & validate
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
  

  // 3) Build payload, include the owner
  const data: any = {
    name,
    guessingPeriod,
    scoreStreaksEnabled,
    bettingMode,
    maxPlayers,
    duration,
    userId,                      // ← set the owner here
  }
  if (scoreStreaksEnabled) 
    data.scoreStreakThresholds = scoreStreakThresholds || ''
  

  // 4) Create
  const config = await prisma.gameConfig.create({ data })
  return NextResponse.json(config, { status: 201 })
}
