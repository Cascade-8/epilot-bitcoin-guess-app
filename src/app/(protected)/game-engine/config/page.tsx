// src/app/(protected)/game/config/page.tsx
import React from 'react'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { GenericButton } from '@/components/atoms/buttons/GenericButton'

export default async function ConfigOverviewPage() {
  const session = await getServerSession(authOptions)
  if (!session) 
    return <p className="p-8 text-center text-white">Redirecting to sign in…</p>
  
  const userId = session.user.id

  const [defaultConfigs, myConfigs] = await Promise.all([
    prisma.gameConfig.findMany({
      where: { userId: null },
      orderBy: { name: 'asc' },
    }),
    prisma.gameConfig.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <main className="p-8 space-y-12">
      {/* Default configs */}
      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">Default Configs</h2>
        {defaultConfigs.length === 0 ? (
          <p className="text-indigo-300">No default configs available.</p>
        ) : (
          <ul className="space-y-3">
            {defaultConfigs.map(cfg => (
              <li
                key={cfg.id}
                className="flex justify-between items-center bg-indigo-800 rounded p-4"
              >
                <div>
                  <p className="text-white font-medium">{cfg.name}</p>
                  <p className="text-indigo-400 text-sm">
                    Period: {cfg.guessingPeriod}ms · Duration:{' '}
                    {cfg.duration ?? '∞'}
                  </p>
                </div>
                <Link href={`/game/config/${cfg.id}/edit`}>
                  <GenericButton>View</GenericButton>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* User's custom configs */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-white">My Configs</h2>
          <Link href="/game/config/new" className={'h-12 w-30'}>
            <GenericButton>+ New Config</GenericButton>
          </Link>
        </div>
        {myConfigs.length === 0 ? (
          <p className="text-indigo-300">You haven’t created any configs yet.</p>
        ) : (
          <ul className="space-y-3">
            {myConfigs.map(cfg => (
              <li
                key={cfg.id}
                className="flex justify-between items-center bg-indigo-800 rounded p-4"
              >
                <div>
                  <p className="text-white font-medium">{cfg.name}</p>
                  <p className="text-indigo-400 text-sm">
                    Period: {cfg.guessingPeriod}ms · Duration:{' '}
                    {cfg.duration ?? '∞'}
                  </p>
                </div>
                <Link href={`/game/config/${cfg.id}/edit`}>
                  <GenericButton>Edit</GenericButton>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
