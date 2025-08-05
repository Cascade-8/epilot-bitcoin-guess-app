'use client'

import React, { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vy: number
  size: number
  emoji: string
}

export const ConfettiFailure: React.FC<{ trigger: boolean }> = ({ trigger }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const startRef = useRef<number>(0)

  useEffect(() => {
    if (!trigger || !canvasRef.current) return

    startRef.current = Date.now()

    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    const rect = canvas.getBoundingClientRect()
    canvas.width = Math.round(rect.width)
    canvas.height = Math.round(rect.height)
    const W = canvas.width
    const H = canvas.height

    const gravity = 0.2
    const reactions = ['💀', '☠️', '💩']

    particlesRef.current = Array.from({ length: 100 }).map(() => ({
      x: Math.random() * W,
      y: -Math.random() * 750,
      vy: 2 + Math.random() * 2,
      size: 20 + Math.random() * 75,
      emoji: reactions[Math.floor(Math.random() * reactions.length)],
    }))

    const draw = () => {
      const now = Date.now()
      const elapsed = now - startRef.current

      ctx.clearRect(0, 0, W, H)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      let moving = false

      particlesRef.current.forEach(p => {
        p.vy += gravity
        p.y += p.vy
        p.x += (Math.random() - 1)

        ctx.font = `${p.size}px serif`
        ctx.fillText(p.emoji, p.x, p.y)

        if (p.y - p.size < H || Math.abs(p.vy) > 0.1) 
          moving = true
        
      })
      particlesRef.current = particlesRef.current.filter(p => p.y - p.size < H)

      if (moving && elapsed < 5000) 
        animRef.current = requestAnimationFrame(draw)
      else
        ctx.clearRect(0, 0, W, H)
    }
    draw()
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current)
    }
  }, [trigger])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}
