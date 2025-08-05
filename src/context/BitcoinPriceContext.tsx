// src/context/BitcoinPriceContext.tsx
'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useBitcoinSocket, PricePoint } from '@/hooks/useBitcoinSocket'

type BitcoinPriceContextType = {
  price: number | null
  recentPrices: PricePoint[]
}

const BitcoinPriceContext = createContext<BitcoinPriceContextType | undefined>(
  undefined
)

export const useBitcoinPrices = (): BitcoinPriceContextType => {
  const context = useContext(BitcoinPriceContext)
  if (!context) throw new Error('useBitcoinPrices must be used within BitcoinPriceProvider')
  return context
}

type ProviderProps = {
  children: ReactNode
}

export const BitcoinPriceProvider = ({ children }: ProviderProps) => {
  const recentPrices = useBitcoinSocket()
  const price = recentPrices[recentPrices.length - 1]?.price ?? null

  return (
    <BitcoinPriceContext.Provider value={{ price, recentPrices }}>
      {children}
    </BitcoinPriceContext.Provider>
  )
}
