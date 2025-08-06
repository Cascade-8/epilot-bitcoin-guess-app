// src/hooks/useBitcoinSocket.tsx
'use client'
import { useEffect, useRef } from 'react'

export type PricePoint = { time: number; price: number }

/**
 * Live‐updates only: buffers incoming ticks and flushes at most every `flushInterval` ms.
 */
export const useBitcoinSocket = (
  onUpdate: (pts: PricePoint[]) => void,
  flushInterval = 200
) => {
  const pendingRef = useRef<PricePoint[]>([])
  const flushTimeout = useRef<number | null>(null)

  useEffect(() => {
    const flush = () => {
      onUpdate(pendingRef.current)
      pendingRef.current = []
      flushTimeout.current = null
    }

    const es = new EventSource('/api/game-engine/stream?channels=price:btc')
    es.onmessage = e => {
      try {
        const msg = JSON.parse(e.data) as {
          channel: 'price:btc'
          type: 'update'
          time: number
          price: number
        }
        if (msg.channel !== 'price:btc') return

        pendingRef.current.push({ time: msg.time, price: msg.price })
        if (flushTimeout.current === null) 
          flushTimeout.current = window.setTimeout(flush, flushInterval)
        
      } catch {}
    }
    return () => {
      es.close()
      if (flushTimeout.current) clearTimeout(flushTimeout.current)
    }
  }, [onUpdate, flushInterval])
}
