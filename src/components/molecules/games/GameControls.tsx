'use client'

import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHandPointUp } from '@fortawesome/free-regular-svg-icons'
import { GenericButton } from '@/components/atoms/buttons/GenericButton'

const formatTime = (ms: number) => {
  const totalSec = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

type Props = {
  price?: number | null
  currentGuess: { type: 'up' | 'down'; price: number; timestamp: Date } | null
  canGuess: boolean
  onGuessAction: (type: 'up' | 'down') => void
  score: number
  timeLeftMs: number
  isUrgent: boolean
  isCorrect: boolean | null
  lastDelta: number | null
}

export const GameControls: React.FC<Props> = ({
  currentGuess,
  canGuess,
  onGuessAction,
  score,
  timeLeftMs,
  isUrgent,
  isCorrect,
  lastDelta,
}) => {
  return (
    <>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-6 p-6 pb-3 w-full max-w-6xl mx-auto">

        {/* Up Button */}
        <div className="flex justify-center col-span-2 md:col-span-1 md:col-start-3 h-12">
          <GenericButton
            onClick={() => onGuessAction('up')}
            className={currentGuess?.type === 'up'
              ? 'disabled:!bg-indigo-700 disabled:!border-cyan-600 disabled:!text-cyan-600'
              : 'disabled:!bg-slate-500 disabled:!border-slate-600 disabled:opacity-60 opacity-100'}
            disabled={!canGuess}
          >
            <FontAwesomeIcon icon={faHandPointUp} />
          </GenericButton>
        </div>

        {/* Down Button */}
        <div className="flex justify-center col-span-2 md:col-span-1 md:col-start-4 h-12">
          <GenericButton
            onClick={() => onGuessAction('down')}
            className={currentGuess?.type === 'down'
              ? 'disabled:!bg-indigo-700 disabled:!border-indigo-900'
              : 'disabled:!bg-slate-500 disabled:!border-slate-600 disabled:opacity-60 opacity-100'}
            disabled={!canGuess}
          >
            <FontAwesomeIcon icon={faHandPointUp} className="rotate-180" />
          </GenericButton>
        </div>

        {/* Score */}
        <div
          className={[
            'relative font-orbitron col-span-2 md:col-span-1 overflow-visible h-12 text-xl rounded-full flex justify-center items-center transition-colors duration-300',
            lastDelta == null
              ? 'border-2 border-indigo-400 bg-indigo-600 text-gray-200'
              : lastDelta > 0
                ? 'border-2 border-green-400 bg-green-600 text-white'
                : 'border-2 border-red-400 bg-red-600 text-white',
          ].join(' ')}
          style={
            lastDelta != null
              ? { animationName: 'pulse', animationDuration: '0.3s', animationIterationCount: 1 }
              : undefined
          }
        >
          {score}
          {lastDelta !== null && (
            <span
              className={[
                'absolute left-1/2 transform -translate-x-1/2 text-5xl font-bold font-orbitron w-fit text-nowrap',
                lastDelta > 0 ? 'text-green-500 animate-fly-up -top-2' : 'text-red-500 animate-fly-down -bottom-2',
              ].join(' ')}
            >
              {lastDelta > 0 ? `+${lastDelta}` : `${lastDelta}`}
            </span>
          )}
        </div>

        {/* Timer */}
        <div
          key={timeLeftMs}
          className={[
            'font-orbitron col-span-2 md:col-span-1 flex justify-center items-center h-12 text-xl border-2 rounded-full transition-none',
            'border-indigo-400 bg-indigo-600 text-gray-200',
            isUrgent && 'border-red-400 bg-red-700 text-red-200',
          ].filter(Boolean).join(' ')}
          style={isUrgent ? { animation: 'urgentFlash 1s forwards linear' } : undefined}
        >
          {formatTime(timeLeftMs)}
        </div>

        {/* Current Guess Display */}
        <div className="col-start-2 md:col-start-4 col-span-2 flex justify-center h-12">
          {currentGuess ? (
            <div
              className={`w-full md:w-auto px-6 py-1 text-sm flex justify-center items-center gap-2 border-2 rounded-full ${
                isCorrect
                  ? 'border-green-400 bg-green-600 text-green-200'
                  : 'border-red-400 bg-red-600 text-red-200'
              }`}
            >
              <p>${currentGuess.price.toFixed(2)}</p>
              <FontAwesomeIcon
                icon={faHandPointUp}
                className={currentGuess.type === 'down' ? 'rotate-180' : ''}
              />
            </div>
          ) : (
            <div className="w-full md:w-auto px-6 py-1 border-2 rounded-full border-transparent" />
          )}
        </div>
      </div>
    </>
  )
}

export default GameControls
