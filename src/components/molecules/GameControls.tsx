// src/components/molecules/GameControls.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useGame, Guess } from '@/context/GameContext'
import { GenericButton } from '@/components/atoms/buttons/GenericButton'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHandPointUp } from '@fortawesome/free-regular-svg-icons'
import { ConfettiSuccess } from '@/components/molecules/ConfettiSuccess'
import { ConfettiFailure } from '@/components/molecules/ConfettiFailure'
import { useBitcoinSocket } from '@/hooks/useBitcoinSocket'

const formatTime = (ms: number) => {
  const totalSec = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export const GameControls: React.FC = () => {
  const prices = useBitcoinSocket()
  const price = prices[prices.length - 1]?.price ?? null

  const { history, userState, placeGuess, game, recentGuess } = useGame()

  const period = game.gameConfig?.guessingPeriod ?? 0
  const score = userState?.score ?? 0

  const [timeLeft, setTimeLeft] = useState(period)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showFailure, setShowFailure] = useState(false)

  const [lastDelta, setLastDelta] = useState<number | null>(null)
  const prevRecentGuess = useRef<Guess | undefined>(recentGuess)

  // Timer
  useEffect(() => {
    const tick = () => {
      if (recentGuess) {
        const ts = new Date(recentGuess.timestamp).getTime()
        const rem = ts + period - Date.now()
        setTimeLeft(Math.max(0, rem))
      } else 
        setTimeLeft(period)
      
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [recentGuess, period])

  // Triggers on resolution
  useEffect(() => {
    if (prevRecentGuess.current && !recentGuess) {
      const last = history[history.length - 1]
      const delta = last.outcome ? 1 : -1
      setLastDelta(delta)

      if (last.outcome) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
      } else {
        setShowFailure(true)
        setTimeout(() => setShowFailure(false), 3000)
      }

      setTimeout(() => setLastDelta(null), 1000)
    }
    prevRecentGuess.current = recentGuess
  }, [recentGuess, history])

  const canGuess = price != null && !recentGuess
  const handleGuess = async(type: 'up' | 'down') => {
    if (!canGuess || price == null) return
    await placeGuess({
      type,
      price,
      timestamp: Date.now(),
    })
  }

  const isCorrect = recentGuess
    ? (recentGuess.type === 'up' ? price! > recentGuess.price : price! < recentGuess.price)
    : false

  return (
    <>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-6 p-6 pb-3 w-full max-w-6xl mx-auto">
        {/* Up Button */}
        <div className="flex justify-center col-span-2 md:col-span-1 md:col-start-3">
          <GenericButton onClick={() => handleGuess('up')} disabled={!canGuess}>
            <FontAwesomeIcon icon={faHandPointUp} />
          </GenericButton>
        </div>
        {/* Down Button */}
        <div className="flex justify-center col-span-2 md:col-span-1 md:col-start-4">
          <GenericButton onClick={() => handleGuess('down')} disabled={!canGuess}>
            <FontAwesomeIcon icon={faHandPointUp} className="rotate-180" />
          </GenericButton>
        </div>

        {/* Score */}
        <div className="relative font-orbitron col-span-2 md:col-span-1 overflow-visible h-12 text-xl border-2 border-indigo-400 bg-indigo-600 text-gray-200 rounded-full flex justify-center items-center">
          {score}
          {lastDelta !== null && (
            <span
              className={`absolute left-1/2 transform -translate-x-1/2 text-2xl font-orbitron ${
                lastDelta > 0
                  ? 'text-green-400 animate-fly-up -top-2'
                  : 'text-red-400 animate-fly-down -bottom-2'
              }`}
            >
              {lastDelta > 0 ? '+1' : '-1'}
            </span>
          )}
        </div>

        {/* Timer */}
        <div className="font-orbitron col-span-2 md:col-span-1 flex justify-center items-center h-12 text-xl border-2 border-indigo-400 bg-indigo-600 text-gray-200 rounded-full">
          {formatTime(timeLeft)}
        </div>

        {/* Current Guess Display */}
        <div className="col-start-2 md:col-start-4 col-span-2 flex justify-center h-12">
          {recentGuess ? (
            <div
              className={`w-full md:w-auto px-6 py-1 text-sm flex justify-center items-center gap-2 border-2 rounded-full ${
                isCorrect
                  ? 'border-green-400 bg-green-600 text-green-200'
                  : 'border-red-400 bg-red-600 text-red-200'
              }`}
            >
              <p>${recentGuess.price.toFixed(2)}</p>
              <FontAwesomeIcon
                icon={faHandPointUp}
                className={recentGuess.type === 'down' ? 'rotate-180' : ''}
              />
            </div>
          ) : (
            <div className="w-full md:w-auto px-6 py-1 border-2 rounded-full border-transparent" />
          )}
        </div>
      </div>
      <ConfettiSuccess trigger={showConfetti} />
      <ConfettiFailure trigger={showFailure} />
    </>
  )
}
