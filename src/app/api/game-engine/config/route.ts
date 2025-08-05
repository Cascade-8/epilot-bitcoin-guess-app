// app/api/game/config/route.ts
import { NextResponse } from 'next/server'
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
  

  // Validate duration (0 = infinite or at least guessingPeriod + offset)
  if (duration !== 0 && duration < guessingPeriod + MIN_DURATION_OFFSET) 
    return NextResponse.json(
      { error: `duration must be 0 or at least guessingPeriod + ${MIN_DURATION_OFFSET}ms` },
      { status: 400 }
    )
  

  // Validate maxPlayers (0 = infinite or up to MAX_PLAYERS)
  if (maxPlayers < 0 || maxPlayers > MAX_PLAYERS) 
    return NextResponse.json(
      { error: `maxPlayers must be between 0 and ${MAX_PLAYERS}` },
      { status: 400 }
    )
  

  // Prepare data and include thresholds only if enabled
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

export const PATCH = async (req: Request) => {
  const {
    id,
    name,
    guessingPeriod,
    scoreStreaksEnabled = false,
    scoreStreakThresholds,
    bettingMode = false,
    maxPlayers = 1,
    duration = 0,
  } = (await req.json()) as ConfigPayload

  if (!id) 
    return NextResponse.json({ error: 'Missing config id' }, { status: 400 })
  

  // Validate guessingPeriod
  if (guessingPeriod < MIN_GUESSING_PERIOD) 
    return NextResponse.json(
      { error: `guessingPeriod must be at least ${MIN_GUESSING_PERIOD}ms` },
      { status: 400 }
    )
  

  // Validate duration
  if (duration !== 0 && duration < guessingPeriod + MIN_DURATION_OFFSET) 
    return NextResponse.json(
      { error: `duration must be 0 or at least guessingPeriod + ${MIN_DURATION_OFFSET}ms` },
      { status: 400 }
    )
  

  // Validate maxPlayers
  if (maxPlayers < 0 || maxPlayers > MAX_PLAYERS) 
    return NextResponse.json(
      { error: `maxPlayers must be between 0 and ${MAX_PLAYERS}` },
      { status: 400 }
    )
  

  // Prepare update data and include thresholds only if enabled
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
      where: { id },
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
