'use client'

import React, { useMemo, useCallback } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import {
  parseFuncs,
  validateFuncSet,
  calculateScore,
  getFunctionIndex,
  getFunctionColors,
} from '@/lib/helpers/scoreStreaksHelper'

type Props = {
  thresholds: string
  nMax?: number // default 50
  height?: number // default 260
  className?: string
}

type ChartPoint = {
  n: number
  value: number
  funcIdx: number
  funcLabel: string
}

export const ScoreStreaksChart: React.FC<Props> = ({
  thresholds,
  nMax = 50,
  height = 260,
  className,
}) => {
  const { data, error, domainY, hasValues, colors } = useMemo(() => {
    const trimmed = thresholds.trim()
    if (!trimmed) 
      return {
        data: [{ n: 0, value: 0, funcIdx: 0, funcLabel: 'Start' }] as ChartPoint[],
        error: 'Enter thresholds to see the chart',
        domainY: [0, 10] as [number, number],
        hasValues: false,
        colors: [] as string[],
      }
    

    const parsed = parseFuncs(trimmed)
    const ve = validateFuncSet(parsed.funcs)

    const allErrors: string[] = []
    if (parsed.errors.length) allErrors.push(...parsed.errors)
    if (ve) allErrors.push(ve)

    if (allErrors.length) 
      return {
        data: [{ n: 0, value: 0, funcIdx: 0, funcLabel: 'Start' }] as ChartPoint[],
        error: allErrors.join('\n'),
        domainY: [0, 10] as [number, number],
        hasValues: false,
        colors: [] as string[],
      }
    

    const { colors, defaultIndex } = getFunctionColors(trimmed)

    const pts: ChartPoint[] = [
      { n: 0, value: 0, funcIdx: defaultIndex, funcLabel: `Default ${parsed.funcs[defaultIndex]?.raw ?? ''}` },
    ]
    const minY = 0
    let maxY = 0

    for (let n = 1; n <= nMax; n++) 
      try {
        const value = Math.round(calculateScore(trimmed, n)) // ensure integer points
        const funcIdx = getFunctionIndex(trimmed, n)
        const f = parsed.funcs[funcIdx]
        const funcLabel = f?.cond ? f.raw : `Default ${f?.raw ?? ''}`

        pts.push({ n, value, funcIdx, funcLabel })
        if (value > maxY) maxY = value
      } catch (e) {
        return {
          data: [{ n: 0, value: 0, funcIdx: defaultIndex, funcLabel: `Default ${parsed.funcs[defaultIndex]?.raw ?? ''}` }] as ChartPoint[],
          error:
            (e as Error)?.message ||
            'Invalid thresholds — cannot calculate scores.',
          domainY: [0, 10] as [number, number],
          hasValues: false,
          colors,
        }
      }
    

    if (minY === maxY) maxY = minY + 1
    const pad = Math.max(1, Math.round((maxY - minY) * 0.1))
    const domainY: [number, number] = [minY, maxY + pad]

    return { data: pts, error: '', domainY, hasValues: pts.length > 0, colors }
  }, [thresholds, nMax])

  // X ticks every 5: [0, 5, 10, ..., nMax]
  const xTicks = useMemo(() => {
    const ticks: number[] = []
    for (let i = 0; i <= nMax; i += 5) ticks.push(i)
    if (ticks[ticks.length - 1] !== nMax) ticks.push(nMax)
    return ticks
  }, [nMax])

  // Custom dot — colored by the rule that produced the point
  const renderDot = useCallback(
    (props: any) => {
      const { cx, cy, payload } = props
      const idx: number = payload.funcIdx ?? 0
      const fill = colors[idx] || '#94a3b8' // slate-400 fallback
      return <circle cx={cx} cy={cy} r={3} fill={fill} stroke="none" />
    },
    [colors]
  )
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null

    const { funcIdx, funcLabel, value } = payload[0].payload
    const color = colors[funcIdx] || '#94a3b8'

    return (
      <div className="bg-indigo-900 border border-slate-600 p-2 rounded text-sm">
        <p className="text-slate-300">n = {label}</p>
        <p>
          <span style={{ color }}>{value}</span>{' '}
          <span style={{ color }} className="text-slate-400">({funcLabel})</span>
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="text-slate-200 text-sm mb-2">
        Score Streaks (n = 0…{nMax})
      </div>

      {error ? (
        <div className="text-red-400 text-sm whitespace-pre-line">{error}</div>
      ) : !hasValues ? (
        <div className="text-slate-400 text-sm">No data to display.</div>
      ) : (
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer>
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="n"
                type="number"
                domain={[0, nMax]}
                ticks={xTicks}
                label={{
                  value: 'n (streak)',
                  position: 'insideBottomRight',
                  offset: -4,
                }}
              />
              <YAxis
                domain={domainY}
                allowDataOverflow
                label={{
                  value: 'score',
                  angle: -90,
                  position: 'insideLeft',
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={0} strokeOpacity={0.2} />

              {/* Neutral line; colored dots show rule colors */}
              <Line
                type="linear"
                dataKey="value"
                stroke="#94a3b8" // slate-400
                strokeWidth={2}
                dot={renderDot}
                isAnimationActive={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default ScoreStreaksChart
