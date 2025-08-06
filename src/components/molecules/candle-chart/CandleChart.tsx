'use client'

import React, {
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
  FunctionComponent,
} from 'react'
import Decimal from 'decimal.js'
import { scaleBand, scaleLinear } from 'd3-scale'
import { useBitcoinPrices } from '@/context/BitcoinPriceContext'
import { useGame } from '@/context/GameContext'
import { Candles } from '@/components/molecules/candle-chart/Candles'
import { VerticalGrid, YAxisGrid } from '@/components/molecules/candle-chart/YAxis'
import { XAxisLabels } from '@/components/molecules/candle-chart/XAxis'
import { PriceLine } from '@/components/molecules/candle-chart/PriceLine'

export interface ChartConfig {
  bucketInterval?: number
  displayBuckets?: number
  displayLabels?: number
  padding?: number
  labelLeftArea?: number
  labelRightArea?: number
  bottomPadding?: number
  maxCandleWidth?: number
  minBodyPx?: number
  minWickPx?: number
}

interface CandleChartProps {
  /** Tailwind-safe minHeight, e.g. 'min-h-[150px]' or 'min-h-0' */
  minHeightClass?: string
  config?: ChartConfig
}

export const CandleChart: FunctionComponent<CandleChartProps> = ({
  minHeightClass = 'min-h-[150px]',
  config = {},
}) => {
  const { recentPrices, price: currentPrice } = useBitcoinPrices()
  const { currentGuess } = useGame()
  const ref = useRef<HTMLDivElement>(null)
  const [{ width, height }, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    if (!ref.current) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const {
    bucketInterval = 5000,
    displayBuckets = 45,
    displayLabels = 5,
    padding = 40,
    labelLeftArea = 75,
    labelRightArea = 75,
    bottomPadding = 20,
    maxCandleWidth = 12,
    minBodyPx = 2,
    minWickPx = 2,
  } = config

  const innerW = Math.max(0, width - labelLeftArea - labelRightArea)
  const innerH = Math.max(0, height - padding * 2 - bottomPadding)

  const candles = useMemo(() => {
    const m = new Map<number, number[]>()
    for (const { time, price } of recentPrices) {
      const b = Math.floor(time / bucketInterval) * bucketInterval
      const arr = m.get(b) || []
      arr.push(price)
      m.set(b, arr)
    }
    return Array.from(m.entries())
      .sort(([a], [b]) => a - b)
      .slice(-displayBuckets)
      .map(([ts, ps]) => ({
        timestamp: ts,
        open: ps[0],
        close: ps[ps.length - 1],
        high: Math.max(...ps),
        low: Math.min(...ps),
      }))
  }, [recentPrices, bucketInterval, displayBuckets])

  const [[yMin, yMax], yTicks] = useMemo(() => {
    if (!candles.length) return [[0, 1], [0, 0.25, 0.5, 0.75, 1]]
    const highs = candles.map((c) => new Decimal(c.high))
    const lows = candles.map((c) => new Decimal(c.low))
    const H = Decimal.max(...highs)
    const L = Decimal.min(...lows)
    const diff = Decimal.max(H.minus(L), new Decimal(0.05))
    const tp = H.plus(diff.div(2))
    const bp = L.minus(diff.div(2))
    const avg = H.plus(L).div(2)
    const mu = avg.plus(tp).div(2)
    const md = avg.plus(bp).div(2)
    const levels = [tp, mu, avg, md, bp].map((d) => Number(d.toFixed(2)))
    return [[levels[4], levels[0]], levels]
  }, [candles])

  const xScale = useMemo(
    () =>
      scaleBand<string>()
        .domain(candles.map((c) => c.timestamp.toString()))
        .range([0, innerW])
        .paddingInner(0.3)
        .paddingOuter(0.1),
    [candles, innerW],
  )
  const yScale = useMemo(
    () => scaleLinear().domain([yMin, yMax]).range([innerH, 0]),
    [yMin, yMax, innerH],
  )

  const yCurrent = yScale(currentPrice ?? 0)
  const yGuess = currentGuess ? yScale(currentGuess.price) : null

  return (
    <div
      ref={ref}
      className={`relative w-full h-full ${minHeightClass}`}
    >
      {width > 0 && height > 0 && (
        <svg
          className="absolute inset-0 w-full h-full bg-indigo-900 rounded text-[8px] md:text-xs lg:text-base"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMinYMin meet"
        >
          <g transform={`translate(${labelLeftArea},${padding})`}>
            <YAxisGrid yScale={yScale} yTicks={yTicks} innerW={innerW} />
            <VerticalGrid candles={candles} xScale={xScale} innerH={innerH} />
            <PriceLine
              yPosition={yCurrent}
              innerW={innerW}
              label={`$${(currentPrice ?? 0).toFixed(2)}`}
              strokeClass="stroke-cyan-400"
              fillClass="fill-cyan-400"
              dashArray="4 4"
            />
            {currentGuess && (
              <PriceLine
                yPosition={yGuess!}
                innerW={innerW}
                labelSide={'left'}
                label={`$${currentGuess.price.toFixed(2)} ${
                  currentGuess.type === 'up' ? '↗️' : '↘️'
                } `}
                strokeClass="stroke-yellow-400"
                fillClass="fill-yellow-400 text-[6px] lg:text-xs"
                dashArray="2 4"
              />
            )}
            <Candles
              candles={candles}
              xScale={xScale}
              yScale={yScale}
              maxCandleWidth={maxCandleWidth}
              minWickPx={minWickPx}
              minBodyPx={minBodyPx}
            />
            <XAxisLabels
              candles={candles}
              xScale={xScale}
              innerH={innerH}
              displayLabels={displayLabels}
            />
          </g>
        </svg>
      )}
    </div>
  )
}
