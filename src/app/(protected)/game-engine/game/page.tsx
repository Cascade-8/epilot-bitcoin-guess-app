'use client'

import { useState, useEffect } from 'react'
import { Game, GameConfig, UserState } from '@/app/generated/prisma'
import { GameCard } from '@/components/molecules/games/GameCard'
import { SessionProvider } from 'next-auth/react'
import { GenericButton } from '@/components/atoms/buttons/GenericButton'
import Link from 'next/link'

type EnhancedGame = Game & {
  userStates: UserState[]
  gameConfig: GameConfig
}

export default function GamesPage() {
  const [games, setGames] = useState<EnhancedGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/game-engine/game')
      .then(res => res.json())
      .then((data: EnhancedGame[]) => setGames(data))
      .catch(err => {
        console.error(err)
        setError('Failed to load games')
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-semibold text-white flex justify-between items-center">
        Games
        <Link href={'/game-engine/game/new'} className={'h-10 w-32'}>
          <GenericButton>Create Game</GenericButton>
        </Link>
      </h1>

      {loading && <p className="text-indigo-200">Loading games…</p>}
      {error && <p className="text-red-400">{error}</p>}
      {!loading && !error && (
        <>
          <section className={['grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
            'gap-6 place-items-center w-full max-w-7xl mx-auto py-6'].join(' ')}>
            {games.length === 0 ? (
              <p className="text-indigo-200">No open games available.</p>
            ) : (
              games.map(game => (
                <SessionProvider key={game.id}>
                  <GameCard game={game} />
                </SessionProvider>
              ))
            )}
          </section>
        </>
      )}
    </main>
  )
}
