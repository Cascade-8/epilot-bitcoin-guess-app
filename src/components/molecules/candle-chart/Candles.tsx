import { ScaleBand, ScaleLinear } from 'd3-scale'
import { FunctionComponent } from 'react'

export type Candle = {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
}
interface CandlesProps {
  candles: Candle[]
  xScale: ScaleBand<string>
  yScale: ScaleLinear<number, number>
  maxCandleWidth: number
  minWickPx: number
  minBodyPx: number
}
const Candles: FunctionComponent<CandlesProps> = ({ candles, xScale, yScale, maxCandleWidth, minWickPx, minBodyPx }) => (
  <>
    {candles.map((c, i) => {
      const ts = c.timestamp.toString()
      const slotX = xScale(ts) ?? 0
      const bw = xScale.bandwidth()
      const cw = Math.min(bw, maxCandleWidth)
      const bx = slotX + (bw - cw) / 2
      const cx = bx + cw / 2

      let yH = yScale(c.high)
      let yL = yScale(c.low)
      const yO = yScale(c.open)
      const yC = yScale(c.close)

      if (Math.abs(yH - yL) < minWickPx) {
        const m = (yH + yL) / 2
        yH = m + minWickPx / 2
        yL = m - minWickPx / 2
      }

      let bodyH = Math.abs(yC - yO)
      let bodyY = Math.min(yO, yC)
      if (bodyH < minBodyPx) {
        bodyH = minBodyPx
        bodyY = (yO + yC) / 2 - bodyH / 2
      }

      const fillCls = c.close >= c.open ? 'fill-green-400' : 'fill-red-400'
      const strokeCls = c.close >= c.open ? 'stroke-green-400' : 'stroke-red-400'

      return (
        <g key={i}>
          <rect x={bx} y={bodyY} width={cw} height={bodyH} className={fillCls} />
          <line x1={cx} x2={cx} y1={yH} y2={yL} strokeWidth={minWickPx} className={strokeCls} />
        </g>
      )
    })}
  </>
)

export { Candles }