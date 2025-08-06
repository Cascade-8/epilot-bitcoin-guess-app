// src/context/BitcoinPriceContext.tsx
'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from 'react'

export type PricePoint = { time: number; price: number }

type BitcoinPriceContextType = {
  price: number | null
  recentPrices: PricePoint[]
}

const BitcoinPriceContext = createContext<BitcoinPriceContextType | undefined>(
  undefined
)

export const useBitcoinPrices = (): BitcoinPriceContextType => {
  const ctx = useContext(BitcoinPriceContext)
  if (!ctx) 
    throw new Error(
      'useBitcoinPrices must be used within a BitcoinPriceProvider'
    )
  
  return ctx
}
/**
 * Bitcoin Price Context to provide the children with the current prices and make them update on every price change
 */
export const BitcoinPriceProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [recentPrices, setRecentPrices] = useState<PricePoint[]>([])
  const [price, setPrice] = useState<number | null>(null)

  // buffers for live updates
  const pendingRef = useRef<PricePoint[]>([])
  const flushTimeout = useRef<number | null>(null)

  const FLUSH_INTERVAL = 200           // ms
  const BUFFER_MS      = 10 * 60 * 1000 // 10 min

  useEffect(() => {
    let es: EventSource

    // 1) Fetch history once
    fetch('/api/currency-streams/bitcoin')
      .then(r => r.json())
      .then((hist: PricePoint[]) => {
        setRecentPrices(hist)
        setPrice(hist[hist.length - 1]?.price ?? null)

        // 2) Open SSE for live updates
        es = new EventSource(
          '/api/game-engine/stream?channels=price:btc'
        )

        es.onmessage = e => {
          try {
            const msg = JSON.parse(e.data) as {
              channel: 'price:btc'
              type: 'update'
              time: number
              price: number
            }
            if (msg.channel !== 'price:btc') return

            // buffer incoming tick
            pendingRef.current.push({ time: msg.time, price: msg.price })

            // schedule flush if none pending
            if (flushTimeout.current === null) 
              flushTimeout.current = window.setTimeout(() => {
                setRecentPrices(prev => {
                  const cutoff = Date.now() - BUFFER_MS
                  const merged = [...prev, ...pendingRef.current].filter(
                    p => p.time >= cutoff
                  )
                  pendingRef.current = []
                  setPrice(merged[merged.length - 1]?.price ?? null)
                  return merged
                })
                flushTimeout.current = null
              }, FLUSH_INTERVAL)
            
          } catch {
            // ignore parse errors
          }
        }

        es.onerror = () => {
          // EventSource will auto-reconnect
        }
      })
      .catch(err => console.error('Failed to load Bitcoin history', err))

    return () => {
      es?.close()
      if (flushTimeout.current !== null) 
        clearTimeout(flushTimeout.current)
      
    }
  }, [])

  return (
    <BitcoinPriceContext.Provider value={{ price, recentPrices }}>
      {children}
    </BitcoinPriceContext.Provider>
  )
}
