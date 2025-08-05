import { ScaleBand } from 'd3-scale'
import React, { FunctionComponent } from 'react'
import { Candle } from '@/components/molecules/candle-chart/Candles'


interface XAxisLabelsProps {
  candles: Candle[]
  xScale: ScaleBand<string>
  innerH: number
  displayLabels: number
}
const XAxisLabels: FunctionComponent<XAxisLabelsProps> = ({ candles, xScale, innerH, displayLabels }) => {
  const interval = Math.max(1, Math.floor(candles.length / displayLabels))
  return (
    <>
      {candles.map((c, i) => {
        if (i % interval !== 0 && i !== candles.length - 1) return null
        const xCenter = (xScale(c.timestamp.toString()) ?? 0) + xScale.bandwidth() / 2
        return (
          <text key={i} x={xCenter} y={innerH + 15} textAnchor="middle" dominantBaseline="hanging" className="fill-indigo-300">
            {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </text>
        )
      })}
    </>
  )
}

export { XAxisLabels }