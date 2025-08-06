// src/context/GameContext.tsx
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

export const GameProvider: React.FC<ProviderProps> = ({ children, game }) => {
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

  // Build WS URL dynamically
  const makeSocketUrl = (channels: string) => {
    if (typeof window === 'undefined') return ''
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    // replace port 3000 -> 3001 (adjust if different)
    const host = window.location.host.replace(/:3000$/, ':3001')
    return `${protocol}://${host}/?channels=${channels}`
  }

  // Subscribe to game updates
  useEffect(() => {
    if (!userId) return
    const channel = `game:${gameId}:${userId}`
    const url = makeSocketUrl(channel)
    const ws = new WebSocket(url)
    const hist = history
    const curr = currentGuess

    ws.onmessage = ({ data }) => {
      const msg = JSON.parse(data) as {
        channel: string
        event: 'guess' | 'state'
        data: any
      }
      if (msg.channel !== channel) return

      if (msg.event === 'guess') {
        const g: Guess = msg.data
        if (g.outcome === null) 
          setCurrentGuess(g)
        else if (curr?.id === g.id) {
          setHistory([...hist, g])
          setCurrentGuess(undefined)
        }
      }

      if (msg.event === 'state') {
        const us: UserState = msg.data
        setUserStates(s => {
          const others = s.filter(x => x.userId !== us.userId)
          return [...others, us]
        })
      }
    }

    ws.onerror = console.error
    return () => ws.close()
  }, [gameId, userId, history, currentGuess])

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
