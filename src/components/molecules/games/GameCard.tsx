// src/components/molecules/games/GameCard.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GenericButton } from '@/components/atoms/buttons/GenericButton'
import { Game, GameConfig, UserState } from '@/app/generated/prisma'
import { useSession } from 'next-auth/react'

type GameCardProps = {
  game: Game & {
    gameConfig: GameConfig
    userStates: UserState[]
  }
}

const GameCard = ({ game }: GameCardProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passcode, setPasscode] = useState('')

  const handleJoin = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/game-engine/game', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          // only send passcode if private
          ...(game.private ? { passcode } : {})
        }),
      })
      const json = await res.json()
      if (!res.ok) 
        setError(json.error || 'Failed to join')
      else 
        // reload page or navigate into game
        window.location.href = `/game-engine/game/${game.id}`
      
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
  const { data: session } = useSession()
  const userId = session?.user?.id
  const hasJoined = userId
    ? game.userStates.some(u => u.userId === userId)
    : false

  return (
    <div className="flex flex-col bg-indigo-800 p-4 rounded w-72 shadow-xl">
      <div className="flex-1">
        <h3 className="text-lg text-white">{game.name || game.gameConfig.name}</h3>

        <p className="text-sm text-indigo-200 font-mono mt-1">
          Players: {game.userStates.length}
          {' / '}
          {game.gameConfig.maxPlayers > 0 ? (
            game.gameConfig.maxPlayers
          ) : (
            <span className="inline-block font-mono text-2xl align-middle">
              ∞
            </span>
          )}
          {game.private && ' 🔒'}
        </p>

        <div className="text-sm text-indigo-200 font-mono mt-4 space-y-1">
          <p><strong>Config:</strong></p>
          <p className="ml-4">Name: {game.gameConfig.name}</p>
          <p className="ml-4">
            Type: {game.gameConfig.userId ? 'Custom' : 'Default'}
          </p>
          <p className="ml-4">
            Guessing Period: {(game.gameConfig.guessingPeriod / 1000).toFixed(0)}s
          </p>
          <p className="ml-4">
            Duration: {game.gameConfig.duration === 0
              ? 'Infinite'
              : `${(game.gameConfig.duration || 0 / 1000).toFixed(0)}s`}
          </p>
          <p className="ml-4">
            Betting Mode: {game.gameConfig.bettingMode ? '✅' : '❌'}
          </p>
          <p className="ml-4">
            Scorestreaks: {game.gameConfig.scoreStreaksEnabled ? '✅' : '❌'}
          </p>
        </div>
      </div>

      {game.private && (
        <input
          type="text"
          placeholder="Passcode…"
          value={passcode}
          onChange={e => setPasscode(e.target.value)}
          className="mt-4 w-full bg-indigo-700 text-white p-2 rounded"
        />
      )}

      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

      <div className="mt-4 space-y-2">
        {hasJoined ? (
          <Link href={`/game-engine/game/${game.id}`}>
            <GenericButton>
             Connect
            </GenericButton>
          </Link>
        ) : (
          <>
            {game.private && (
              <input
                type="text"
                placeholder="Passcode…"
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                className="w-full bg-indigo-700 text-white p-2 rounded"
              />
            )}
            <GenericButton onClick={handleJoin} disabled={loading}>
              {loading
                ? 'Joining…'
                : game.private
                  ? 'Enter Passcode'
                  : 'Join'}
            </GenericButton>
          </>
        )}
      </div>
    </div>
  )
}

export { GameCard }