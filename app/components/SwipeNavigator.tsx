'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useRef, useState, useEffect } from 'react'
import { Home, BarChart2, Users, User, BookOpen, Swords } from 'lucide-react'

const ROUTES = [
  { href: '/dashboard',  label: 'Today',     Icon: Home,      color: '#22c55e' },
  { href: '/challenges', label: 'Programs',  Icon: Swords,    color: '#f87171' },
  { href: '/journal',    label: 'Journal',   Icon: BookOpen,  color: '#818cf8' },
  { href: '/analytics',  label: 'Analytics', Icon: BarChart2, color: '#fbbf24' },
  { href: '/squads',     label: 'Squads',    Icon: Users,     color: '#34d399' },
  { href: '/profile',    label: 'Profile',   Icon: User,      color: '#c084fc' },
]

export default function SwipeNavigator({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const startX = useRef(0)
  const startY = useRef(0)
  const isHorizontal = useRef(false)
  const busy = useRef(false)
  const slideDir = useRef(0) // -1 = swiped left, 1 = swiped right
  const [dragX, setDragX] = useState(0)
  const [ms, setMs] = useState(0)

  const currentIndex = ROUTES.findIndex(r => pathname.startsWith(r.href))
  const prevRoute = currentIndex > 0 ? ROUTES[currentIndex - 1] : null
  const nextRoute = currentIndex < ROUTES.length - 1 ? ROUTES[currentIndex + 1] : null

  // Peek panel only shown during active drag (not during incoming slide)
  const isDragging = !busy.current && Math.abs(dragX) > 5
  const peekRoute = isDragging ? (dragX < 0 ? nextRoute : prevRoute) : null
  const peekDir = dragX < 0 ? 1 : -1

  // When pathname changes, navigation is done — slide new content in from opposite side
  useEffect(() => {
    if (!busy.current || slideDir.current === 0) return
    const W = window.innerWidth
    // New content arrives from opposite direction to where old content left
    const incomingFrom = slideDir.current * W // slid left (-1*W=-W)? new comes from right (+W)...
    // Actually: if dir=-1 (swiped left), old went to -W, new comes from +W
    // incomingFrom = -slideDir.current * W
    const from = -slideDir.current * W

    // Instantly place new content off-screen on the opposite side
    setMs(0)
    setDragX(from)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Slide it in to center
        setMs(240)
        setDragX(0)
        setTimeout(() => {
          busy.current = false
          slideDir.current = 0
        }, 240)
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

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
    const atEnd = currentIndex >= ROUTES.length - 1 && dx < 0
    setMs(0)
    setDragX(atStart || atEnd ? dx * 0.1 : dx)
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (busy.current || !isHorizontal.current) return
    const dx = e.changedTouches[0].clientX - startX.current
    isHorizontal.current = false

    if (currentIndex === -1 || Math.abs(dx) < 50) {
      setMs(300)
      setDragX(0)
      return
    }

    const nextIndex = dx < 0
      ? Math.min(currentIndex + 1, ROUTES.length - 1)
      : Math.max(currentIndex - 1, 0)

    if (nextIndex === currentIndex) {
      setMs(300)
      setDragX(0)
      return
    }

    const W = window.innerWidth
    // dir: -1 = swiped left (next page), 1 = swiped right (prev page)
    const dir = dx < 0 ? -1 : 1

    busy.current = true
    slideDir.current = dir
    setMs(220)
    setDragX(dir * W) // slide current page off in swipe direction

    setTimeout(() => {
      router.push(ROUTES[nextIndex].href)
      // pathname useEffect will handle sliding the new page in
    }, 220)
  }

  const easing = `${ms}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`

  return (
    <div style={{ height: '100%', width: '100%', overflow: 'hidden', position: 'relative', background: 'var(--bg)' }}>

      {/* Adjacent page peek — only during active drag */}
      {peekRoute && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            background: 'var(--bg)',
            transform: `translateX(calc(${peekDir * 100}% + ${dragX}px))`,
            transition: 'none',
            zIndex: 1,
          }}
        >
          <peekRoute.Icon
            size={56}
            strokeWidth={1.5}
            color={peekRoute.color}
            style={{ opacity: Math.min(1, Math.abs(dragX) / 80) }}
          />
          <span style={{
            color: peekRoute.color,
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '0.05em',
            opacity: Math.min(1, Math.abs(dragX) / 80),
          }}>
            {peekRoute.label}
          </span>
        </div>
      )}

      {/* Main content */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          height: '100%',
          width: '100%',
          position: 'relative',
          zIndex: 2,
          transform: `translateX(${dragX}px)`,
          transition: ms > 0 ? `transform ${easing}` : 'none',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  )
}
