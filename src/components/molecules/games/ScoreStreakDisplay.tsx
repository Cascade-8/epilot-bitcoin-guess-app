'use client'
import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  streak?: number | null
  lastDelta?: number | null
  className?: string
}

const LAUNCH_MS = 2400

export const ScoreStreakDisplay: React.FC<Props> = ({
  streak = 0,
  lastDelta = null,
  className,
}) => {
  const anchorRef = useRef<HTMLSpanElement | null>(null)

  const [animating, setAnimating] = useState(false)
  const [origin, setOrigin] = useState<{ left: number; top: number } | null>(null)
  const portalRef = useRef<HTMLSpanElement | null>(null)
  const animRef = useRef<Animation | null>(null)
  const startedRef = useRef(false)
  const prevStreak = useRef(streak ?? 0)

  useEffect(() => {
    if ((lastDelta ?? 0) > 0) tryStartLaunch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastDelta])

  useEffect(() => {
    const curr = streak || 0
    if (curr > (prevStreak.current ?? 0)) tryStartLaunch()
    prevStreak.current = curr
  }, [streak])

  const tryStartLaunch = () => {
    if (animating || startedRef.current) return
    if (!anchorRef.current) return
    startedRef.current = true

    const rect = anchorRef.current.getBoundingClientRect()
    setOrigin({ left: rect.left, top: rect.top })
    setAnimating(true)
  }

  useEffect(() => {
    if (!animating || !origin) return
    const el = portalRef.current
    if (!el) return

    el.style.position = 'fixed'
    el.style.left = `${origin.left}px`
    el.style.top = `${origin.top}px`
    el.style.zIndex = '9999'
    el.style.willChange = 'transform'
    el.style.transformOrigin = '50% 50%'

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced || !('animate' in el)) {
      el.style.transform = 'translateY(0) rotate(-45deg)'
      const t = setTimeout(handleFinish, 400)
      return () => clearTimeout(t)
    }

    const anim = el.animate(
      [
        { transform: 'translateY(0) rotate(0deg)',        offset: 0.0,  easing: 'ease-out' },
        { transform: 'translateY(0) rotate(-45deg)',      offset: 0.12, easing: 'ease-in-out' },
        { transform: 'translateY(10px) rotate(-45deg)',   offset: 0.30, easing: 'ease-in-out' },
        { transform: 'translateY(0) rotate(-45deg)',      offset: 0.62, easing: 'ease-in-out' },

        { transform: 'translateY(-1px) rotate(-45deg)',   offset: 0.66, easing: 'ease-in-out' },
        { transform: 'translateY(1px)  rotate(-45deg)',   offset: 0.70, easing: 'ease-in-out' },
        { transform: 'translateY(0)    rotate(-45deg)',   offset: 0.74, easing: 'cubic-bezier(0.42, 0, 1, 1)' },

        { transform: 'translateY(-180vh) rotate(-45deg)', offset: 1.0 }
      ],
      {
        duration: LAUNCH_MS,
        easing: 'linear',
        fill: 'forwards',
      }
    )

    animRef.current = anim
    const onDone = () => handleFinish()
    anim.addEventListener('finish', onDone)
    anim.addEventListener('cancel', onDone)

    return () => {
      anim.removeEventListener('finish', onDone)
      anim.removeEventListener('cancel', onDone)
      anim.cancel()
    }
  }, [animating, origin])

  const handleFinish = () => {
    animRef.current = null
    startedRef.current = false
    setAnimating(false)
    setOrigin(null)
  }

  const pillClasses = [
    'relative font-orbitron overflow-visible h-12 text-xl rounded-full flex justify-center items-center transition-colors duration-300 px-4',
    lastDelta == null
      ? 'border-2 border-indigo-400 bg-indigo-600 text-gray-200'
      : lastDelta > 0
        ? 'border-2 border-green-400 bg-green-600 text-white'
        : 'border-2 border-red-400 bg-red-600 text-white',
  ].join(' ')

  return (
    <div className={`flex items-center gap-3 overflow-visible ${className || ''}`}>
      <span
        ref={anchorRef}
        className="select-none inline-block"
        aria-hidden="true"
        style={{ visibility: animating ? 'hidden' : 'visible' }}
      >
        🚀
      </span>
      {animating && origin && typeof document !== 'undefined'
        ? createPortal(
          <span ref={portalRef} className="select-none inline-block">🚀</span>,
          document.body
        )
        : null}
      <div
        className={pillClasses}
        style={
          lastDelta != null
            ? { animationName: 'pulse', animationDuration: '0.3s', animationIterationCount: 1 }
            : undefined
        }
      >
        {streak}
      </div>
    </div>
  )
}

export default ScoreStreakDisplay
