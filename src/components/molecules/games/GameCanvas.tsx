import { FC } from 'react'

import { CandleChart } from '@/components/molecules/candle-chart/CandleChart'
import { PriceDisplay } from '@/components/molecules/games/PriceDisplay'
import { GameControls } from '@/components/molecules/games/GameControls'

/**
 * Game Canvas to display the game on different devices
 * CandleChart config gets slightly adjusted to enable responsive functionalities
 * @constructor
 */
const GameCanvas: FC = () => {
  return (
    <div className="flex flex-col px-4 sm:px-6 py-6 bg-indigo-800 border-2 border-indigo-500 text-gray-100 rounded-xl shadow-lg w-full h-full max-h-screen">
      <PriceDisplay />
      {/* Mobile View */}
      <div className="flex-1 mt-3 block md:hidden">
        <CandleChart
          config={{
            labelLeftArea: 55,
            labelRightArea: 50,
            displayBuckets: 40,
            displayLabels: 4,
            maxCandleWidth: 10
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
            displayLabels: 6
          }}/>
      </div>

      {/* WQHD View */}
      <div className="flex-1 mt-3 hidden 2xl:block h-full">
        <CandleChart
          config={{
            labelLeftArea: 100,
            labelRightArea: 100,
            displayBuckets: 100,
            displayLabels: 6
          }}/>
      </div>
      <GameControls />
    </div>
  )
}

export { GameCanvas }
