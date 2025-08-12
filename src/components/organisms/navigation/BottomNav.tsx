'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faGamepad, faCogs, faExpand, faCompress, faSignOutAlt } from '@fortawesome/free-solid-svg-icons'


/**
 * Bottom navigation element
 * Slides out of view on mobile devices and can get pulled up by a quick swipe up
 */
const BottomNav = () => {
  const [fullscreen, setFullscreen] = useState(false)
  const [visible, setVisible] = useState(true)
  const hideTimeout = useRef<number | null>(null)
  const touchStartY = useRef<number>(0)
  const touchStartTime = useRef<number>(0)
  const scrollStartY = useRef<number>(0)

  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0)

  const resetHideTimer = () => {
    if (hideTimeout.current) window.clearTimeout(hideTimeout.current)
    hideTimeout.current = window.setTimeout(() => setVisible(false), 3000)
  }

  const showNav = () => {
    setVisible(true)
    resetHideTimer()
  }

  useEffect(() => {
    const handleFsChange = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFsChange)

    if (isTouchDevice) {
      resetHideTimer()

      const handleTouchStart = (e: TouchEvent) => {
        touchStartY.current = e.touches[0].clientY
        touchStartTime.current = e.timeStamp
        scrollStartY.current = window.scrollY
      }
      const handleTouchEnd = (e: TouchEvent) => {
        const touchEndY = e.changedTouches[0].clientY
        const deltaY = touchEndY - touchStartY.current
        const deltaTime = e.timeStamp - touchStartTime.current
        const scrollEndY = window.scrollY
        const velocity = deltaY / deltaTime
        const fastSwipe = velocity < -0.5

        if (fastSwipe) {
          showNav()
          return
        }
        if (Math.abs(scrollEndY - scrollStartY.current) > 0) return
        if (deltaY < -30) showNav()
      }

      window.addEventListener('touchstart', handleTouchStart)
      window.addEventListener('touchend', handleTouchEnd)

      return () => {
        window.removeEventListener('touchstart', handleTouchStart)
        window.removeEventListener('touchend', handleTouchEnd)
        if (hideTimeout.current) window.clearTimeout(hideTimeout.current)
        document.removeEventListener('fullscreenchange', handleFsChange)
      }
    }
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange)
    }
  }, [isTouchDevice])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
  }

  const handleInteraction = () => {
    if (isTouchDevice) showNav()
  }

  return (
    <nav
      className={`fixed bottom-0 z-40 left-0 right-0 bg-indigo-800 border-t border-indigo-600 transform transition-transform duration-300 ${!isTouchDevice || visible ? 'translate-y-0' : 'translate-y-full'}`}
    >
      <ul className="flex justify-around items-center h-16">
        {/*Todo add account page*/}
        {/*<li>*/}
        {/*  <Link*/}
        {/*    href="/account"*/}
        {/*    onClick={handleInteraction}*/}
        {/*    className="flex flex-col items-center text-indigo-200 hover:text-white cursor-pointer"*/}
        {/*  >*/}
        {/*    <FontAwesomeIcon icon={faUser} size="lg" />*/}
        {/*    <span className="text-xs">Account</span>*/}
        {/*  </Link>*/}
        {/*</li>*/}
        <li>
          <Link
            href="/game-engine/game"
            onClick={handleInteraction}
            className="flex flex-col items-center text-indigo-200 hover:text-white cursor-pointer"
          >
            <FontAwesomeIcon icon={faGamepad} size="lg" />
            <span className="text-xs">Games</span>
          </Link>
        </li>
        <li>
          <Link
            href="/game-engine/config"
            onClick={handleInteraction}
            className="flex flex-col items-center text-indigo-200 hover:text-white cursor-pointer"
          >
            <FontAwesomeIcon icon={faCogs} size="lg" />
            <span className="text-xs">Configs</span>
          </Link>
        </li>
        <li>
          <button
            type="button"
            onClick={() => {
              toggleFullscreen()
              handleInteraction()
            }}
            className="flex flex-col items-center text-indigo-200 hover:text-white focus:outline-none cursor-pointer"
          >
            <FontAwesomeIcon icon={fullscreen ? faCompress : faExpand} size="lg" />
            <span className="text-xs">Fullscreen</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => {
              signOut({ callbackUrl: '/' } )
              handleInteraction()
            }}
            className="flex flex-col items-center text-indigo-200 hover:text-white focus:outline-none cursor-pointer"
          >
            <FontAwesomeIcon icon={faSignOutAlt} size="lg" />
            <span className="text-xs">Logout</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}

export { BottomNav }