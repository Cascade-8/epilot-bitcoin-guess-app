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

/**
 * Dynamic Line to mark Prices f.e. the current price or a guessed price
 * @param yPosition The y position of the line
 * @param innerW  The length
 * @param label The description of the line
 * @param strokeClass the colour of the line
 * @param fillClass the text colour of the label
 * @param dashArray style of the line
 * @param labelSide alignment of the label
 * @param offsetX Offset of the label
 */
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
