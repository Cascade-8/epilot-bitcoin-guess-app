import { ReactNode } from 'react'
import { GameProvider } from '@/context/GameContext'
import { GameCanvas } from '@/components/molecules/GameCanvas'
import { Game, GameConfig } from '@/app/generated/prisma'
import { BitcoinPriceProvider } from '@/context/BitcoinPriceContext'

type GamePageProps = {
  children?: ReactNode
  game: Game & {
    gameConfig: GameConfig

  }
}

const GamePage = ({ children, game }: GamePageProps) => {
  return (
    <BitcoinPriceProvider>
      <GameProvider game={game}>
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <GameCanvas />
        </div>
      </GameProvider>
    </BitcoinPriceProvider>
  )
}

export { GamePage }