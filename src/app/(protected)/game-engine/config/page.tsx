// src/app/(protected)/game/config/page.tsx
import React from 'react'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { GenericButton } from '@/components/atoms/buttons/GenericButton'
import { GameConfigLine } from '@/app/(protected)/game-engine/config/_components/GameConfigLine'

export default async function ConfigOverviewPage() {
  const session = await getServerSession(authOptions)
  if (!session) 
    return <p className="p-8 text-center text-white">Redirecting to sign in…</p>
  
  const userId = session.user.id

  const [defaultConfigs, myConfigs, sharedConfigs] = await Promise.all([
    prisma.gameConfig.findMany({
      where: { userId: null },
      orderBy: { name: 'asc' },
    }),
    prisma.gameConfig.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    }),
    prisma.gameConfig.findMany({
      where: {
        AND: [
          { userId: { not: userId } },
          { userId: { not: null } },
        ],
        games: {
          some: {
            userStates: {
              some: { userId },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <main className="p-8 space-y-12">
      {/* My configs */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-white">My Configs</h2>
          <Link href="./new" className={'h-8 w-32'}>
            <GenericButton>New Config</GenericButton>
          </Link>
        </div>
        {myConfigs.length === 0 ? (
          <p className="text-indigo-300">You haven’t created any configs yet.</p>
        ) : (
          <ul className="space-y-3">
            {myConfigs.map(cfg => (
              <GameConfigLine config={cfg}
                key={cfg.id}
                cta={<Link href={`/game-engine/config/${cfg.id}`} className="h-8 min-w-16 w-16">
                  <GenericButton>View</GenericButton>
                </Link>}
              />
            ))}
          </ul>
        )}
      </section>
      {/* Default configs */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-white">Default Configs</h2>
        </div>
        {defaultConfigs.length === 0 ? (
          <p className="text-indigo-300">No default configs available.</p>
        ) : (
          <ul className="space-y-3">
            {defaultConfigs.map(cfg => (
              <GameConfigLine config={cfg}
                key={cfg.id}
                cta={<Link href={`/game-engine/config/${cfg.id}`} className="h-8 min-w-16 w-16">
                  <GenericButton>View</GenericButton>
                </Link>}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Shared configs */}
      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">
          Shared Configs
        </h2>

        {sharedConfigs.length === 0 ? (
          <p className="text-indigo-300">You have no shared configs yet.</p>
        ) : (
          <ul className="space-y-3">
            {sharedConfigs.map(cfg => (
              <GameConfigLine config={cfg}
                key={cfg.id}
                cta={<Link href={`/game-engine/config/${cfg.id}`} className="h-8 min-w-16 w-16">
                  <GenericButton>View</GenericButton>
                </Link>}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
