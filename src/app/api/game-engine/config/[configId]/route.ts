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

const bad = (status: number, error: string) => {
  return NextResponse.json({ error }, { status })
}

const getUserId = async() => {
  const session = await getServerSession(authOptions)
  return session?.user?.id ?? null
}

/* -------------------- DELETE (owner only) -------------------- */
export const DELETE = async (
  _req: Request,
  { params }: { params: { configId: string } }
) => {
  const userId = await getUserId()
  if (!userId) return bad(401, 'Not authenticated')

  const { configId } = params
  if (!configId) return bad(400, 'Missing config id')

  const config = await prisma.gameConfig.findUnique({
    where: { id: configId },
    select: { userId: true },
  })
  if (!config) return bad(404, 'Config not found')
  if (config.userId !== userId) return bad(403, 'Forbidden')

  await prisma.gameConfig.delete({ where: { id: configId } })
  return new NextResponse(null, { status: 204 })
}

/* -------------------- GET (owner OR public OR member) -------------------- */
export const GET = async (
  _req: Request,
  { params }: { params: { configId: string } }
) => {
  const userId = await getUserId() // may be null (not logged in)
  const { configId } = params
  if (!configId) return bad(400, 'Missing config id')

  const config = await prisma.gameConfig.findUnique({
    where: { id: configId },
  })
  if (!config) return bad(404, 'Config not found')

  const isOwner = !!userId && config.userId === userId
  const isPublic = !!config.isPublic
  const isDefaultConfig = config.userId == null

  let isMember = false
  if (userId && !isOwner && !isPublic && !isDefaultConfig) {
    const membership = await prisma.userState.findFirst({
      where: { userId, game: { configId } },
      select: { id: true },
    })
    isMember = !!membership
  }

  if (!(isOwner || isPublic || isDefaultConfig || isMember)) 
    return bad(403, 'Forbidden')
  

  return NextResponse.json({
    ...config,
    canEdit: isOwner,         // handy for the UI
    currentUserId: userId,    // optional convenience
  })
}

/* -------------------- PATCH (owner only) -------------------- */
export const PATCH = async (
  req: Request,
  { params }: { params: { configId: string } }
) => {
  const userId = await getUserId()
  if (!userId) return bad(401, 'Not authenticated')

  const { configId } = params
  if (!configId) return bad(400, 'Missing config id')

  const ownerCheck = await prisma.gameConfig.findUnique({
    where: { id: configId },
    select: { userId: true },
  })
  if (!ownerCheck) return bad(404, 'Config not found')
  if (ownerCheck.userId !== userId) return bad(403, 'Forbidden')

  const {
    name,
    guessingPeriod,
    scoreStreaksEnabled = false,
    scoreStreakThresholds,
    bettingMode = false,
    maxPlayers = 1,
    duration = 0,
  } = (await req.json()) as ConfigPayload

  if (!name) return bad(400, 'name is required')
  if (guessingPeriod < MIN_GUESSING_PERIOD)
    return bad(400, `guessingPeriod must be at least ${MIN_GUESSING_PERIOD}ms`)
  if (duration !== 0 && duration < guessingPeriod + MIN_DURATION_OFFSET)
    return bad(400, `duration must be 0 or at least guessingPeriod + ${MIN_DURATION_OFFSET}ms`)
  if (maxPlayers < 0 || maxPlayers > MAX_PLAYERS)
    return bad(400, `maxPlayers must be between 0 and ${MAX_PLAYERS}`)

  const data: any = {
    name,
    guessingPeriod,
    scoreStreaksEnabled,
    bettingMode,
    maxPlayers,
    duration,
  }
  // only store thresholds if enabled; clear otherwise
  data.scoreStreakThresholds = scoreStreaksEnabled ? (scoreStreakThresholds ?? '') : null

  try {
    const updated = await prisma.gameConfig.update({
      where: { id: configId },
      data,
    })
    return NextResponse.json({ ...updated, canEdit: true })
  } catch (e: any) {
    return bad(500, e.message || 'Failed to update config')
  }
}

/* -------------------- POST (create; owner = current user) -------------------- */
export const POST = async (req: Request) => {
  const userId = await getUserId()
  if (!userId) return bad(401, 'Not authenticated')

  const {
    name,
    guessingPeriod,
    scoreStreaksEnabled = false,
    scoreStreakThresholds,
    bettingMode = false,
    maxPlayers = 1,
    duration = 0,
  } = (await req.json()) as ConfigPayload

  if (!name) return bad(400, 'name is required')
  if (guessingPeriod < MIN_GUESSING_PERIOD)
    return bad(400, `guessingPeriod must be at least ${MIN_GUESSING_PERIOD}ms`)
  if (duration !== 0 && duration < guessingPeriod + MIN_DURATION_OFFSET)
    return bad(400, `duration must be 0 or at least guessingPeriod + ${MIN_DURATION_OFFSET}ms`)
  if (maxPlayers < 0 || maxPlayers > MAX_PLAYERS)
    return bad(400, `maxPlayers must be between 0 and ${MAX_PLAYERS}`)

  const data: any = {
    name,
    guessingPeriod,
    scoreStreaksEnabled,
    bettingMode,
    maxPlayers,
    duration,
    userId, // 👈 set owner
  }
  data.scoreStreakThresholds = scoreStreaksEnabled ? (scoreStreakThresholds ?? '') : null

  const created = await prisma.gameConfig.create({
    data,
    select: {
      id: true,
      name: true,
      userId: true,
      scoreStreaksEnabled: true,
      scoreStreakThresholds: true,
      guessingPeriod: true,
      bettingMode: true,
      maxPlayers: true,
      duration: true,
      isPublic: true,
    },
  })

  return NextResponse.json({ ...created, canEdit: true }, { status: 201 })
}
