'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { useSession } from 'next-auth/react'
import { Game, GameConfig, Guess, UserState } from '@/app/generated/prisma'

interface GameContextType {
  history: Guess[]
  currentGuess?: Guess
  userState?: UserState
  placeGuess: (guess: GuessRequest) => Promise<void>
  game: Game & { gameConfig: GameConfig }
}
export type GuessRequest = Pick<Guess, 'type' | 'price' | 'timestamp'>


/**
 * Context to handle the game states and game updates received from the Event Stream
 */
const GameContext = createContext<GameContextType | undefined>(undefined)
export const useGame = (): GameContextType => {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be inside <GameProvider>')
  return ctx
}

type ProviderProps = {
  children: ReactNode
  game: Game & { gameConfig: GameConfig }
}

const GameProvider: React.FC<ProviderProps> = ({ children, game }) => {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const gameId = game.id

  const [history, setHistory] = useState<Guess[]>([])
  const [userStates, setUserStates] = useState<UserState[]>([])
  const [currentGuess, setCurrentGuess] = useState<Guess | undefined>()

  // Load initial history and state
  useEffect(() => {
    fetch(`/api/game-engine/game/${gameId}/history`)
      .then(r => r.json())
      .then((data: Guess[]) => {
        setHistory(data)
        setCurrentGuess(data.find(g => g.outcome === null))
      })
    fetch(`/api/game-engine/game/${gameId}`)
      .then(r => r.json())
      .then((g: { userStates: UserState[] }) => setUserStates(g.userStates))
  }, [gameId])

  // Subscribe to live game updates via SSE
  useEffect(() => {
    if (!userId) return
    const channel = `game:${gameId}:${userId}`
    const origin  = typeof window !== 'undefined'
      ? window.location.origin
      : ''
    const streamUrl = `${origin}/api/game-engine/stream?channels=${channel}`
    const es = new EventSource(streamUrl)

    es.onmessage = e => {
      try {
        const msg = JSON.parse(e.data) as {
          channel: string
          type: 'update'
          event: 'guess' | 'state'
          data: any
          time: number
        }
        if (msg.channel !== channel) return
        if (msg.event === 'guess') {
          const g = msg.data as Guess
          if (g.outcome === null) 
            setCurrentGuess(g)
          else {
            setHistory(prev => [...prev, g])
            setCurrentGuess(undefined)
          }
        } else if (msg.event === 'state') {
          const us = msg.data as UserState
          setUserStates(prev => {
            const others = prev.filter(x => x.userId !== us.userId)
            return [...others, us]
          })
        }
      } catch (err) {
        console.error('[SSE] parse error', err)
      }
    }

    es.onerror = err => {
      console.error('[SSE] error', err)
    }

    return () => {
      es.close()
    }
  }, [gameId, userId])

  const placeGuess = async (guessReq: GuessRequest) => {
    await fetch(`/api/game-engine/game/${gameId}/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guessReq),
    })
  }

  const userState = userStates.find(s => s.userId === userId)

  return (
    <GameContext.Provider
      value={{ history, currentGuess, userState, placeGuess, game }}
    >
      {children}
    </GameContext.Provider>
  )
}

export { GameProvider }
