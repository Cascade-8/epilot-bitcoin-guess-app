'use client'

import React, { useEffect, useRef } from 'react'

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  angle: number;
  va: number;
  color: string;
}

export const ConfettiSuccess: React.FC<{ trigger: boolean }> = ({ trigger }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number | null>(null)
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    if (!trigger || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const W = (canvas.width = window.innerWidth)
    const H = (canvas.height = window.innerHeight)

    const gravity = 0.2
    particlesRef.current = []

    const spawnSide = (x0: number, count: number, direction: 1 | -1) => {
      for (let i = 0; i < count; i++) 
        particlesRef.current.push({
          x: x0,
          y: H * 0.8,
          size: 5 + Math.random() * 15,
          vx: direction * (2 + Math.random() * 10),
          vy: -(8 + Math.random() * 6),
          angle: Math.random() * Math.PI * 2,
          va: (Math.random() - 0.5) * 0.2,
          color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        })
    }
    spawnSide(0, 50, 1)    // left cannon
    spawnSide(W, 50, -1)   // right cannon

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      particlesRef.current.forEach(p => {
        p.vy += gravity
        p.x += p.vx
        p.y += p.vy
        p.angle += p.va

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        ctx.restore()
      })
      if (particlesRef.current.some(p => p.y < H + p.size)) 
        animRef.current = requestAnimationFrame(draw)
      else 
        ctx.clearRect(0, 0, W, H)
    }
    draw()
    return () => {
      if (animRef.current !== null) 
        cancelAnimationFrame(animRef.current)
    }
  }, [trigger])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 w-screen h-screen"
    />
  )
}
