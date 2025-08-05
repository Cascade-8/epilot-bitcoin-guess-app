// src/app/(protected)/game-engine/game/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Game, GameConfig, User, UserState } from '@/app/generated/prisma'
import { GameCard } from '@/components/molecules/games/GameCard'
import { SessionProvider } from 'next-auth/react'

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
    <main className="p-8 max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-semibold text-white">Games</h1>

      {loading && <p className="text-indigo-200">Loading games…</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!loading && !error && (
        <>
          <section className="space-y-6 flex items-start justify-start flex-wrap w-full gap-6">
            {games.length === 0 ? (
              <p className="text-indigo-200">No open games available.</p>
            ) : (
              games.map(game => <SessionProvider  key={game.id}><GameCard game={game} /></SessionProvider>)
            )}
          </section>
        </>
      )}
    </main>
  )
}
