import React, { FunctionComponent } from 'react'

interface PriceLineProps {
  yPosition: number
  innerW: number
  label: string
  strokeClass: string
  fillClass: string
  dashArray: string
  labelSide?: 'left' | 'right'
  offsetX?: number
}

const PriceLine: FunctionComponent<PriceLineProps> = ({
  yPosition,
  innerW,
  label,
  strokeClass,
  fillClass,
  dashArray,
  labelSide = 'right',
  offsetX = 0,
}) => {
  const isLeft = labelSide === 'left'
  const textX = isLeft ? -offsetX : innerW + offsetX
  const anchor = isLeft ? 'end' : 'start'

  return (
    <g>
      <line
        x1={0}
        x2={innerW}
        y1={yPosition}
        y2={yPosition}
        strokeDasharray={dashArray}
        className={strokeClass}
      />
      <text
        x={textX}
        y={yPosition}
        textAnchor={anchor}
        dominantBaseline="middle"
        className={fillClass}
      >
        {label}
      </text>
    </g>
  )
}

export { PriceLine }
