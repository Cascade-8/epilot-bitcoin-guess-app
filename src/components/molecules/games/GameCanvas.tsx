'use client'

import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { CandleChart } from '@/components/molecules/charts/candle-chart/CandleChart'
import { PriceDisplay } from '@/components/molecules/games/PriceDisplay'
import GameControls from '@/components/molecules/games/GameControls'
import ScoreStreakDisplay from '@/components/molecules/games/ScoreStreakDisplay'
import { useGame } from '@/context/GameContext'
import { useBitcoinPrices } from '@/context/BitcoinPriceContext'
import { Guess } from '@/app/generated/prisma'
import { ConfettiSuccess } from '@/components/molecules/games/ConfettiSuccess'
import { ConfettiFailure } from '@/components/molecules/games/ConfettiFailure'

const GameCanvas: FC = () => {
  const { price } = useBitcoinPrices()
  const { history, userState, placeGuess, game, currentGuess } = useGame()

  const score = userState?.score ?? 0
  const streak = userState?.streak ?? 0
  const period = game.gameConfig?.guessingPeriod ?? 0

  // Local UI state
  const [timeLeft, setTimeLeft] = useState(period)
  const [lastDelta, setLastDelta] = useState<number | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showFailure, setShowFailure] = useState(false)
  const prevRecentGuess = useRef<Guess | undefined>(currentGuess || undefined)
  // Timer logic (owned here)
  useEffect(() => {
    const tick = () => {
      if (currentGuess) {
        const ts = new Date(currentGuess.timestamp).getTime()
        const rem = ts + period - Date.now()
        setTimeLeft(Math.max(0, rem))
      } else 
        setTimeLeft(period)
      
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [currentGuess, period])

  // Confetti + delta logic (owned here)
  useEffect(() => {
    if (prevRecentGuess.current && !currentGuess && history.length) {
      const last = history[history.length - 1]
      const delta = last.outcome ? 1 : -1 // keep your current delta semantics
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
    prevRecentGuess.current = currentGuess || undefined
  }, [currentGuess, history])

  // Derived UI flags
  const canGuess = price != null && !currentGuess
  const isCorrect = useMemo(() => {
    if (!currentGuess || price == null) return null
    return currentGuess.type === 'up' ? price > currentGuess.price : price < currentGuess.price
  }, [currentGuess, price])
  const isUrgent = timeLeft <= 5000

  // Delegate action
  const handleGuess = async (type: 'up' | 'down') => {
    if (!canGuess || price == null) return
    await placeGuess({ type, price, timestamp: new Date() })
  }

  return (
    <div className="flex flex-col px-4 sm:px-6 py-6 bg-indigo-800 border-2 border-indigo-500 text-gray-100 rounded-xl shadow-lg w-full h-full max-h-screen">
      <div className="flex items-center justify-between">
        <ScoreStreakDisplay streak={streak} lastDelta={lastDelta}  />
        <PriceDisplay />
        <div />
      </div>

      {/* Mobile View */}
      <div className="flex-1 mt-3 block md:hidden">
        <CandleChart
          config={{
            labelLeftArea: 55,
            labelRightArea: 50,
            displayBuckets: 40,
            displayLabels: 4,
            maxCandleWidth: 10,
          }}
        />
      </div>

      {/* Tablet View (Default) */}
      <div className="flex-1 mt-3 hidden md:block lg:hidden 2xl:hidden h-full">
        <CandleChart />
      </div>

      {/* Full HD View */}
      <div className="flex-1 mt-3 hidden lg:block 2xl:hidden h-full">
        <CandleChart
          config={{
            labelLeftArea: 100,
            labelRightArea: 100,
            displayBuckets: 60,
            displayLabels: 6,
          }}
        />
      </div>

      {/* WQHD View */}
      <div className="flex-1 mt-3 hidden 2xl:block h-full">
        <CandleChart
          config={{
            labelLeftArea: 100,
            labelRightArea: 100,
            displayBuckets: 100,
            displayLabels: 6,
          }}
        />
      </div>

      <GameControls
        price={price}
        currentGuess={currentGuess ? { type: currentGuess.type, price: currentGuess.price, timestamp: new Date(currentGuess.timestamp) } : null}
        canGuess={canGuess}
        onGuessAction={handleGuess}
        score={score}
        timeLeftMs={timeLeft}
        isUrgent={isUrgent}
        isCorrect={isCorrect}
        lastDelta={lastDelta}
      />
      <ConfettiSuccess trigger={showConfetti} emojis={['💸', ' 💵', '💴', '💶', '💷']} />
      <ConfettiFailure trigger={showFailure} emojis={['💀', '☠️', '💩']} />
    </div>
  )
}

export { GameCanvas }
