// src/app/(protected)/game-engine/game/[gameId]/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { Game, GameConfig, User } from '@/app/generated/prisma'
import { GamePage } from '@/components/pages/GamePage'
import { SessionProvider } from 'next-auth/react'

type EnhancedGame = Game & {
  users: User[]
  gameConfig: GameConfig
}

interface Props {
  params: Promise<{ gameId: string }>
}

const GameDetailPage: React.FC<Props> = (props) => {
  const { gameId } = React.use(props.params)

  const [game, setGame] = useState<EnhancedGame | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/game-engine/game?gameId=${gameId}`)
      .then(res => res.json())
      .then((data: EnhancedGame[]) => {
        if (Array.isArray(data) && data.length > 0) 
          setGame(data[0])
        else 
          setError('Game not found')
        
      })
      .catch(() => setError('Failed to load game'))
      .finally(() => setLoading(false))
  }, [gameId])

  if (loading) 
    return <p className="p-8 text-indigo-200 w-full text-center">Loading game…</p>

  if (error || !game) 
    return <p className="p-8 text-red-400">{error || 'Unknown error'}</p>


  return (
    <SessionProvider><GamePage game={game}></GamePage></SessionProvider>
  )
}

export default GameDetailPage
