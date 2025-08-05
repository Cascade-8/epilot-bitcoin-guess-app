// src/context/GameContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { Game, GameConfig } from '@/app/generated/prisma'

export type GuessType = 'up' | 'down'

export interface Guess {
  id: string
  userId: string
  type: GuessType
  price: number
  timestamp: number
  period: number
  outcome?: boolean
}

export type GuessRequest = Pick<Guess, 'type' | 'price' | 'timestamp'>

export interface UserState {
  userId: string
  score: number
  joinedAt: string
}

interface GameContextType {
  history: Guess[]
  recentGuess?: Guess
  userState?: UserState
  placeGuess: (guess: GuessRequest) => Promise<void>
  game: Game & {
    gameConfig?: GameConfig
    userState?: UserState
  }
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export const useGame = (): GameContextType => {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be inside <GameProvider>')
  return ctx
}

type ProviderProps = {
  children: ReactNode
  game: Game
}

export const GameProvider: React.FC<ProviderProps> = ({ children, game }) => {
  const { data: session } = useSession()
  const { id: gameId } = game
  const userId = session?.user?.id

  const [history, setHistory] = useState<Guess[]>([])
  const [userStates, setUserStates] = useState<UserState[]>([])

  useEffect(() => {
    fetch(`/api/game-engine/game/${gameId}/history`)
      .then(res => res.json())
      .then((data: Guess[]) => setHistory(data))
      .catch(console.error)

    fetch(`/api/game-engine/game/${gameId}`)
      .then(res => res.json())
      .then((game: { userStates: UserState[] }) => setUserStates(game.userStates))
      .catch(console.error)
  }, [gameId])

  useEffect(() => {
    const es = new EventSource(`/api/game-engine/game/${gameId}/stream`)
    es.addEventListener('guess', (e: MessageEvent) => {
      const g: Guess = JSON.parse(e.data)
      setHistory(prev => [...prev, g])
    })
    es.addEventListener('state', (e: MessageEvent) => {
      const us: UserState = JSON.parse(e.data)
      setUserStates(prev => {
        const others = prev.filter(s => s.userId !== us.userId)
        return [...others, us]
      })
    })
    es.onerror = () => es.close()
    return () => es.close()
  }, [gameId])

  const placeGuess = async (guess: GuessRequest) => {
    await fetch(`/api/game-engine/game/${gameId}/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guess),
    })
  }

  const recentGuess = history.find(g => g.outcome === null)
  const userState = userStates.find(s => s.userId === userId)
  return (
    <GameContext.Provider value={{ history, recentGuess, userState, placeGuess, game }}>
      {children}
    </GameContext.Provider>
  )
}
