import { ScaleBand, ScaleLinear } from 'd3-scale'
import React, { FunctionComponent } from 'react'
import { Candle } from '@/components/molecules/charts/candle-chart/Candles'

interface YAxisGridProps {
  yScale: ScaleLinear<number, number>
  yTicks: number[]
  innerW: number
}
const YAxisGrid: FunctionComponent<YAxisGridProps> = ({ yScale, yTicks, innerW }) => (
  <>
    {yTicks.map((v, i) => {
      const y = yScale(v)
      return (
        <g key={i}>
          <text x={-4} y={y} textAnchor="end" dominantBaseline="middle" className="fill-indigo-300">
            ${v.toFixed(2)}
          </text>
          <line x1={0} x2={innerW} y1={y} y2={y} strokeDasharray="0.5 1" className="stroke-indigo-300" />
        </g>
      )
    })}
  </>
)

interface VerticalGridProps {
  candles: Candle[]
  xScale: ScaleBand<string>
  innerH: number
}
const VerticalGrid: FunctionComponent<VerticalGridProps> = ({ candles, xScale, innerH }) => (
  <>
    {candles.map((c, i) => {
      const xCenter = (xScale(c.timestamp.toString()) ?? 0) + xScale.bandwidth() / 2
      return <line key={i} x1={xCenter} x2={xCenter} y1={0} y2={innerH} strokeDasharray="0.2 1" className="stroke-indigo-300" />
    })}
  </>
)

export { VerticalGrid, YAxisGrid }