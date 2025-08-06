'use client'

import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightDots } from '@fortawesome/free-solid-svg-icons'
import { useBitcoinPrices } from '@/context/BitcoinPriceContext'

const PRICE_BUFFER_LENGTH = 10
/**
 * PriceDisplay with render icon to show the current price and trend
 */
export const PriceDisplay = () => {
  const { recentPrices } = useBitcoinPrices()
  const [trendDirection, setTrendDirection] = useState<'up' | 'down' | null>(null)

  useEffect(() => {
    if (recentPrices.length < 2) return

    const trimmed = recentPrices
      .slice(-PRICE_BUFFER_LENGTH)
      .map((p) => p.price)

    const oldest = trimmed[0]
    const newest = trimmed[trimmed.length - 1]

    if (newest > oldest) setTrendDirection('up')
    else if (newest < oldest) setTrendDirection('down')
  }, [recentPrices])

  const renderTrendIcon = () => {
    if (trendDirection === 'up')
      return <FontAwesomeIcon icon={faArrowUpRightDots} className="text-green-400 ml-2" />
    if (trendDirection === 'down')
      return (
        <FontAwesomeIcon
          icon={faArrowUpRightDots}
          className="text-red-400 ml-2 transform rotate-180 scale-x-[-1]"
        />
      )
    return null
  }

  const latest = recentPrices[recentPrices.length - 1]?.price ?? null

  return (
    <p className="text-4xl font-mono my-2 flex items-center justify-center">
      {latest !== null
        ? `$${latest.toLocaleString('en-US', {
          minimumFractionDigits: 2,
        })}`
        : 'Loading...'}
      {renderTrendIcon()}
    </p>
  )
}
