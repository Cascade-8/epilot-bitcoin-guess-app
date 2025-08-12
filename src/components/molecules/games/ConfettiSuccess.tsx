'use client'

import React, { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  angle: number
  va: number
  color: string
  img?: HTMLCanvasElement
}

/**
 * Two confetti cannons on trigger
 * @param trigger the trigger to start the animation
 * @param emojis emopis or characters to use as confetti. Fallback are rectangular particles
 */
export const ConfettiSuccess: React.FC<{
  trigger: boolean
  emojis?: string[]
}> = ({ trigger, emojis = [] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number | null>(null)
  const particlesRef = useRef<Particle[]>([])

  const emojisRef = useRef<string[]>(emojis)

  useEffect(() => {
    if (trigger) emojisRef.current = emojis
  }, [trigger, emojis])

  useEffect(() => {
    if (!trigger || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!

    const W = (canvas.width = window.innerWidth)
    const H = (canvas.height = window.innerHeight)
    const gravity = 0.2

    const emojiImgs: Record<string, HTMLCanvasElement> = {}
    for (const e of emojisRef.current) {
      const off = document.createElement('canvas')
      off.width = off.height = 64
      const octx = off.getContext('2d')!
      octx.font = '64px serif'
      octx.textAlign = 'center'
      octx.textBaseline = 'middle'
      octx.fillText(e, 32, 32)
      emojiImgs[e] = off
    }

    particlesRef.current = []
    const spawnSide = (x0: number, count: number, dir: 1 | -1) => {
      for (let i = 0; i < count; i++) {
        const size = 15 + Math.random() * 25
        const emoji = emojisRef.current.length
          ? emojisRef.current[Math.floor(Math.random() * emojisRef.current.length)]
          : undefined
        particlesRef.current.push({
          x: x0,
          y: H * 0.8,
          size,
          vx: dir * (2 + Math.random() * 5),
          vy: -(8 + Math.random() * 6),
          angle: Math.random() * Math.PI * 2,
          va: (Math.random() - 0.5) * 0.2,
          color: `hsl(${Math.random() * 360}, 70%, 60%)`,
          img: emoji ? emojiImgs[emoji] : undefined,
        })
      }
    }
    spawnSide(0, 50, 1)
    spawnSide(W, 50, -1)

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      for (const p of particlesRef.current) {
        p.vy += gravity
        p.x += p.vx
        p.y += p.vy
        p.angle += p.va

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        if (p.img) 
          ctx.drawImage(p.img, -p.size/2, -p.size/2, p.size, p.size)
        else {
          ctx.fillStyle = p.color
          ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size)
        }
        ctx.restore()
      }

      particlesRef.current = particlesRef.current.filter(
        p => p.y - p.size < H + 50
      )
      if (particlesRef.current.length > 0) 
        animRef.current = requestAnimationFrame(draw)
      else 
        ctx.clearRect(0, 0, W, H)
      
    }

    draw()
    return () => {
      if (animRef.current != null) cancelAnimationFrame(animRef.current)
    }
  }, [trigger])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 w-screen h-screen"
    />
  )
}
