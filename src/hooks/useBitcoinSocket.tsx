// src/hooks/useBitcoinSocket.ts
import { useEffect, useState, useRef } from 'react'

export type PricePoint = { time: number; price: number }

export const useBitcoinSocket = (bufferMs = 10 * 60 * 1000) => {
  const [prices, setPrices] = useState<PricePoint[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const retryRef = useRef(0)
  const timeoutRef = useRef<number | null>(null)

  const connect = () => {
    // avoid creating a new socket if one is already alive
    const existing = wsRef.current
    if (existing && (existing.readyState === WebSocket.CONNECTING || existing.readyState === WebSocket.OPEN))
      return


    const socket = new WebSocket('ws://localhost:3001')
    wsRef.current = socket

    socket.onopen = () => {
      console.log('[WS] connected')
      retryRef.current = 0
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    socket.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data) as PricePoint & { type: string }
        setPrices(prev => {
          const merged = [...prev, { time: msg.time, price: msg.price }]
          const cutoff = Date.now() - bufferMs
          return merged.filter(p => p.time >= cutoff)
        })
      } catch {}
    }

    // remove or noop onerror so we don't double-trigger reconnect
    socket.onerror = () => {
      // console.warn('[WS] error (ignored), waiting for onclose')
    }

    socket.onclose = () => {
      // console.warn('[WS] disconnected, retrying…')
      if (timeoutRef.current === null) {
        const delay = Math.min(10000, 1000 * 2 ** retryRef.current)
        retryRef.current += 1
        timeoutRef.current = window.setTimeout(connect, delay)
      }
    }
  }

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
      if (timeoutRef.current !== null)
        clearTimeout(timeoutRef.current)

    }
  }, [bufferMs])

  return prices
}
