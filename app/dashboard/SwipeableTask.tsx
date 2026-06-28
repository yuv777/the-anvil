'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Timer } from 'lucide-react'

const SWIPE_THRESHOLD = 80

const CATEGORY_COLORS: Record<string, string> = {
  physical:   'var(--cat-physical)',
  mental:     'var(--cat-mental)',
  confidence: 'var(--cat-confidence)',
  spiritual:  'var(--cat-spiritual)',
  lifestyle:  'var(--cat-lifestyle)',
}

export interface Task {
  id: string
  category: string
  activityName: string
  value: string
  emoji: string
  completed: boolean
  dailyTaskId: string
  activityId: string
}

interface Props {
  task: Task
  completing: boolean
  onToggle: () => void
  onSkip: () => void
  onTimer?: () => void
}

function haptic(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

export default function SwipeableTask({ task, completing, onToggle, onSkip, onTimer }: Props) {
  const [offset, setOffset] = useState(0)
  const [animating, setAnimating] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const onToggleRef = useRef(onToggle)
  const onSkipRef = useRef(onSkip)
  useEffect(() => { onToggleRef.current = onToggle }, [onToggle])
  useEffect(() => { onSkipRef.current = onSkip }, [onSkip])

  const startX = useRef(0)
  const startY = useRef(0)
  const liveOffset = useRef(0)
  const isHoriz = useRef<boolean | null>(null)
  const hapticFired = useRef(false)
  const dragging = useRef(false)

  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    function onTouchStart(e: TouchEvent) {
      startX.current = e.touches[0].clientX
      startY.current = e.touches[0].clientY
      isHoriz.current = null
      hapticFired.current = false
      dragging.current = true
      liveOffset.current = 0
    }

    function onTouchMove(e: TouchEvent) {
      if (!dragging.current) return
      const dx = e.touches[0].clientX - startX.current
      const dy = e.touches[0].clientY - startY.current

      if (isHoriz.current === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        isHoriz.current = Math.abs(dx) > Math.abs(dy)
      }

      if (!isHoriz.current) return
      e.preventDefault()

      const abs = Math.abs(dx)
      const resisted = abs > SWIPE_THRESHOLD
        ? SWIPE_THRESHOLD + (abs - SWIPE_THRESHOLD) * 0.2
        : abs
      const next = dx > 0 ? resisted : -resisted

      liveOffset.current = next
      setOffset(next)

      if (abs >= SWIPE_THRESHOLD && !hapticFired.current) {
        haptic(12)
        hapticFired.current = true
      }
      if (abs < SWIPE_THRESHOLD - 15) {
        hapticFired.current = false
      }
    }

    function onTouchEnd() {
      dragging.current = false
      const off = liveOffset.current

      if (off >= SWIPE_THRESHOLD) {
        setAnimating(true)
        setOffset(480)
        haptic([15, 60, 25])
        setTimeout(() => {
          onToggleRef.current()
          setOffset(0)
          setAnimating(false)
        }, 300)
      } else if (off <= -SWIPE_THRESHOLD) {
        setAnimating(true)
        setOffset(-480)
        haptic([12, 30])
        setTimeout(() => {
          onSkipRef.current()
          setOffset(0)
          setAnimating(false)
        }, 300)
      } else {
        setAnimating(true)
        setOffset(0)
        setTimeout(() => setAnimating(false), 280)
      }

      liveOffset.current = 0
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  const abs = Math.abs(offset)
  const progress = Math.min(1, abs / SWIPE_THRESHOLD)
  const goingRight = offset > 6
  const goingLeft = offset < -6
  const catColor = CATEGORY_COLORS[task.category] || 'var(--text-2)'

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Reveal layer */}
      <div
        className="absolute inset-0 rounded-2xl flex items-center px-5"
        style={{
          background: goingRight
            ? `rgba(34,197,94,${progress * 0.22})`
            : goingLeft
            ? `rgba(239,68,68,${progress * 0.18})`
            : 'transparent',
          justifyContent: goingRight ? 'flex-start' : 'flex-end',
        }}
      >
        <span
          className="text-xl"
          style={{ opacity: progress, transform: `scale(${0.4 + progress * 0.6})`, transition: 'transform 0.1s' }}
        >
          {goingRight ? '✓' : goingLeft ? '×' : ''}
        </span>
      </div>

      {/* Card */}
      <div
        ref={cardRef}
        onClick={!completing ? onToggle : undefined}
        style={{
          transform: `translateX(${offset}px)`,
          transition: animating ? 'transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none',
          touchAction: 'pan-y',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          background: task.completed ? 'rgba(34,197,94,0.04)' : 'var(--surface)',
          border: `1px solid ${task.completed ? 'rgba(34,197,94,0.2)' : 'var(--border)'}`,
        }}
        className={`w-full text-left rounded-2xl p-4 cursor-pointer transition-opacity ${completing ? 'opacity-50' : ''}`}
      >
        <div className="flex items-center gap-3.5">
          {/* Checkbox */}
          <div
            className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              borderColor: task.completed ? 'var(--green)' : 'var(--border-2)',
              background: task.completed ? 'var(--green)' : 'transparent',
            }}
          >
            {task.completed && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div
              className="text-sm font-semibold leading-tight transition-colors"
              style={{ color: task.completed ? 'var(--text-2)' : 'var(--text)', textDecoration: task.completed ? 'line-through' : 'none' }}
            >
              {task.activityName}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: catColor }} />
              <span className="text-xs capitalize" style={{ color: 'var(--text-2)' }}>
                {task.category} · {task.value}
              </span>
            </div>
          </div>

          {/* Timer button */}
          {onTimer && !task.completed && (
            <button
              onClick={e => { e.stopPropagation(); onTimer() }}
              className="shrink-0 p-2 rounded-xl transition-colors"
              style={{ background: 'var(--surface-2)' }}
            >
              <Timer size={15} style={{ color: 'var(--green)' }} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
