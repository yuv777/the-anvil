'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useRef } from 'react'

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
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current

    // Ignore scrolls — require a mostly-horizontal swipe of at least 60px
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return

    const currentIndex = NAV_ROUTES.findIndex(r => pathname.startsWith(r))
    if (currentIndex === -1) return

    const nextIndex = dx < 0
      ? Math.min(currentIndex + 1, NAV_ROUTES.length - 1)
      : Math.max(currentIndex - 1, 0)

    if (nextIndex !== currentIndex) {
      router.push(NAV_ROUTES[nextIndex])
    }
  }

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ height: '100%', width: '100%' }}>
      {children}
    </div>
  )
}
