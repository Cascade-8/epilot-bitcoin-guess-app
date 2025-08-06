// src/hooks/useBitcoinSocket.ts
'use client'

import { useEffect, useState, useRef } from 'react'

export type PricePoint = { time: number; price: number }

export const useBitcoinSocket = (bufferMs = 10 * 60 * 1000) => {
  const [prices, setPrices] = useState<PricePoint[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const retryRef = useRef(0)
  const timeoutRef = useRef<number | null>(null)

  // Build ws:// or wss:// URL on the fly
  const getSocketUrl = () => {
    if (typeof window === 'undefined') return ''
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    // replace the front-end port with your WS port if different
    const host = window.location.host.replace(/:3000$/, ':3001')
    return `${protocol}://${host}/?channels=price:btc`
  }

  const connect = () => {
    const existing = wsRef.current
    if (
      existing &&
      (existing.readyState === WebSocket.CONNECTING ||
        existing.readyState === WebSocket.OPEN)
    ) 
      return
    

    const url = getSocketUrl()
    const socket = new WebSocket(url)
    wsRef.current = socket

    socket.onopen = () => {
      console.log(`[WS] connected to price:btc @ ${url}`)
      retryRef.current = 0
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    socket.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data) as {
          channel: string
          type: 'price' | 'history'
          time: number
          price: number
        }
        if (msg.channel !== 'price:btc') return

        setPrices(prev => {
          const cutoff = Date.now() - bufferMs
          const merged = [...prev, { time: msg.time, price: msg.price }]
          return merged.filter(p => p.time >= cutoff)
        })
      } catch (err) {
        console.error('[WS] message parse error', err)
      }
    }

    socket.onerror = (err) => {
      console.warn('[WS] error', err)
      // let onclose handle reconnect
    }

    socket.onclose = () => {
      console.log('[WS] closed — retrying')
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
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
    }
  }, [bufferMs])

  return prices
}
