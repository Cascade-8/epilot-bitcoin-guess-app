// src/components/GameConfigCard.tsx
'use client'

import React, { ReactNode } from 'react'
import { GameConfig } from '@/app/generated/prisma'


interface GameConfigCardProps {
  config: GameConfig
  cta?: ReactNode
  onClick?: () => void
}

export const GameConfigLine: React.FC<GameConfigCardProps> = ({
  config,
  cta,
  onClick,
}) => {
  return (
    <li
      onClick={onClick}
      key={config.id}
      className="flex justify-between items-center bg-indigo-800 rounded p-4 select-none"
    >
      <div>
        <p className="text-white font-medium">{config.name}</p>
        <div className="flex items-center flex-wrap gap-1 justify-start text-indigo-400 text-xs md:text-sm">
          <p>Period: {config.guessingPeriod / 1000}s</p>
          <p>·</p>
          <p>
            Duration:{' '}
            {config.duration === 0 ? '∞' : `${config.duration || 0 / 1000}s`}
          </p>
          {config.bettingMode && (
            <>
              <p>·</p>
              <p>Bets enabled</p>
            </>
          )}
          {config.scoreStreaksEnabled && (
            <>
              <p>·</p>
              <p>Scorestreaks enabled</p>
            </>
          )}
        </div>
      </div>
      {cta}
    </li>
  )
}
