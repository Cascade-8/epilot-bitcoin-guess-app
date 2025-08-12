'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GenericButton } from '@/components/atoms/buttons/GenericButton'
import { Game, GameConfig, UserState } from '@/app/generated/prisma'
import { useSession } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEarthAmerica, faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons'

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
          ...(game.private ? { passcode } : {}),
        }),
      })
      const json = await res.json()
      if (!res.ok) setError(json.error || 'Failed to join')
      else window.location.href = `/game-engine/game/${game.id}`
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const { data: session } = useSession()
  const userId = session?.user?.id
  const userState = game.userStates.find(u => u.userId === userId)
  const hasJoined = !!userState
  return (
    <div className="flex flex-col bg-indigo-800 p-4 rounded w-full shadow-xl">
      <div className="flex-1">
        <h3 className="text-lg text-white flex justify-between">{game.name || game.gameConfig.name}
          <span className={['select-none', game.private ? hasJoined ? 'text-green-500' : 'text-red-700' : 'text-cyan-300'].join(' ')}>
            <FontAwesomeIcon icon={game.private ? hasJoined ? faLockOpen : faLock : faEarthAmerica}/>
          </span>
        </h3>
        <p className="text-sm text-indigo-200 font-mono mt-1">
          Players: {game.userStates.length} /{' '}
          {game.gameConfig.maxPlayers > 0
            ? game.gameConfig.maxPlayers
            : <span className="font-mono font-bold align-middle mr-2">∞</span>}
        </p>
        <p className="text-sm text-indigo-200 font-mono mt-1">
          Score: {userState?.score || ''}
        </p>

        <div className="text-sm text-indigo-200 font-mono mt-4 space-y-1">
          <p><strong>Config:</strong></p>
          <p className="ml-4">Name: {game.gameConfig.name}</p>
          <p className="ml-4">
            Type: {game.gameConfig.userId ? 'Custom' : 'Default'}
          </p>
          <p className="ml-4">
            Guessing Period: {(game.gameConfig.guessingPeriod/1000).toFixed(0)}s
          </p>
          <p className="ml-4">
            Duration: {game.gameConfig.duration === 0
              ? 'Infinite'
              : `${(game.gameConfig.duration || 0/1000).toFixed(0)}s`}
          </p>
          <p className="ml-4">
            Betting Mode: {game.gameConfig.bettingMode ? '✅' : '❌'}
          </p>
          <p className="ml-4">
            Scorestreaks: {game.gameConfig.scoreStreaksEnabled ? '✅' : '❌'}
          </p>
        </div>
      </div>

      {/* Always-reserved passcode area */}
      <div className="mt-4">
        <input
          type="text"
          placeholder={game.private && !hasJoined ? 'Passcode…' : ''}
          value={game.private && !hasJoined ? passcode : ''}
          onChange={e => setPasscode(e.target.value)}
          disabled={!game.private || hasJoined}
          className={`w-full bg-indigo-700 text-white p-2 rounded placeholder-indigo-400 
            ${game.private && !hasJoined ? '' : 'opacity-0 pointer-events-none'}`}
        />
      </div>

      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

      <div className="mt-4 w-32 mx-auto">
        {hasJoined ? (
          <Link href={`/game-engine/game/${game.id}`}>
            <GenericButton>Connect</GenericButton>
          </Link>
        ) : (
          <GenericButton onClick={handleJoin} disabled={loading}>
            {loading
              ? 'Joining…'
              : game.private
                ? 'Enter Passcode'
                : 'Join'}
          </GenericButton>
        )}
      </div>
    </div>
  )
}

export { GameCard }
