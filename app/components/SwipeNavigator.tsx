'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

const NAV_ROUTES = [
  '/dashboard',
  '/challenges',
  '/journal',
  '/analytics',
  '/squads',
  '/profile',
]

export default function SwipeNavigator({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const startX = useRef(0)
  const startY = useRef(0)
  const isHorizontal = useRef(false)
  const busy = useRef(false)
  const [dragX, setDragX] = useState(0)
  const [ms, setMs] = useState(0)

  const currentIndex = NAV_ROUTES.findIndex(r => pathname.startsWith(r))

  function onTouchStart(e: React.TouchEvent) {
    if (busy.current) return
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    isHorizontal.current = false
  }

  function onTouchMove(e: React.TouchEvent) {
    if (busy.current) return
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current

    if (!isHorizontal.current) {
      if (Math.abs(dy) > Math.abs(dx)) return
      isHorizontal.current = true
    }

    const atStart = currentIndex <= 0 && dx > 0
    const atEnd = currentIndex >= NAV_ROUTES.length - 1 && dx < 0
    setMs(0)
    setDragX(atStart || atEnd ? dx * 0.12 : dx)
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (busy.current || !isHorizontal.current) return
    const dx = e.changedTouches[0].clientX - startX.current
    isHorizontal.current = false

    if (currentIndex === -1 || Math.abs(dx) < 50) {
      setMs(280)
      setDragX(0)
      return
    }

    const nextIndex = dx < 0
      ? Math.min(currentIndex + 1, NAV_ROUTES.length - 1)
      : Math.max(currentIndex - 1, 0)

    if (nextIndex === currentIndex) {
      setMs(280)
      setDragX(0)
      return
    }

    busy.current = true
    const W = window.innerWidth
    setMs(220)
    setDragX(dx < 0 ? -W : W)

    setTimeout(() => {
      router.push(NAV_ROUTES[nextIndex])
      setMs(0)
      setDragX(0)
      setTimeout(() => { busy.current = false }, 80)
    }, 220)
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        transform: `translateX(${dragX}px)`,
        transition: ms > 0 ? `transform ${ms}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)` : 'none',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  )
}
