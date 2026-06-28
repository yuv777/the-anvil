'use client'

import { useState, useEffect } from 'react'
import { X, Play, Pause, RotateCcw } from 'lucide-react'

interface Props {
  taskName: string
  totalSeconds: number
  onClose: () => void
}

export function extractSeconds(text: string): number | null {
  const min = text.match(/(\d+)\s*-?\s*min/i)
  if (min) return parseInt(min[1]) * 60
  const sec = text.match(/(\d+)\s*s(?:ec(?:ond)?s?)?(?:\s|$)/i)
  if (sec) return parseInt(sec[1])
  return null
}

export default function TaskTimer({ taskName, totalSeconds, onClose }: Props) {
  const [remaining, setRemaining]   = useState(totalSeconds)
  const [running, setRunning]       = useState(false)
  const [done, setDone]             = useState(false)

  useEffect(() => {
    if (!running || remaining <= 0) return
    const t = setTimeout(() => {
      setRemaining(r => {
        if (r <= 1) { setRunning(false); setDone(true); return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearTimeout(t)
  }, [running, remaining])

  useEffect(() => {
    if (done && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100, 50, 200])
    }
  }, [done])

  const pct   = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0
  const R     = 44
  const circ  = 2 * Math.PI * R
  const mins  = Math.floor(remaining / 60)
  const secs  = remaining % 60

  function reset() { setRemaining(totalSeconds); setRunning(false); setDone(false) }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center pb-10 px-5"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="w-full flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Timer</p>
            <p className="text-sm font-semibold mt-0.5 leading-snug" style={{ color: 'var(--text)' }}>{taskName}</p>
          </div>
          <button onClick={onClose} className="p-1 shrink-0">
            <X size={16} style={{ color: 'var(--text-3)' }} />
          </button>
        </div>

        {/* Circle progress */}
        <div className="relative" style={{ width: 180, height: 180 }}>
          <svg width="180" height="180" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r={R} fill="none" stroke="var(--border-2)" strokeWidth="4" />
            <circle
              cx="50" cy="50" r={R} fill="none"
              stroke={done ? 'var(--gold)' : 'var(--green)'}
              strokeWidth="4" strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct / 100)}
              style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'none' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {done ? (
              <div className="text-5xl">✅</div>
            ) : (
              <>
                <span className="text-4xl font-black tabular-nums" style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                  {mins}:{String(secs).padStart(2, '0')}
                </span>
                <span className="text-xs mt-1.5" style={{ color: 'var(--text-3)' }}>
                  {running ? 'remaining' : 'ready'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Controls */}
        {done ? (
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl font-bold text-sm"
            style={{ background: 'var(--green)', color: '#000' }}
          >
            Done — Mark Task Complete
          </button>
        ) : (
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setRunning(r => !r)}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm"
              style={{ background: 'var(--green)', color: '#000' }}
            >
              {running ? <Pause size={16} /> : <Play size={16} />}
              {running ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={reset}
              className="px-5 py-4 rounded-2xl"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}
            >
              <RotateCcw size={16} style={{ color: 'var(--text-2)' }} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
