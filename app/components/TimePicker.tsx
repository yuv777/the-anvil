'use client'
import { useRef, useState, useEffect } from 'react'

const ITEM_H = 52

interface ColProps {
  items: string[]
  value: string
  onChange: (v: string) => void
  width?: number
}

function Col({ items, value, onChange, width = 72 }: ColProps) {
  const ref = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const initIdx = Math.max(0, items.indexOf(value))
  const [localIdx, setLocalIdx] = useState(initIdx)

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = initIdx * ITEM_H
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleScroll() {
    if (!ref.current) return
    const clamped = Math.max(0, Math.min(items.length - 1, Math.round(ref.current.scrollTop / ITEM_H)))
    setLocalIdx(clamped)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (items[clamped] !== value) onChange(items[clamped])
    }, 120)
  }

  return (
    <div style={{ position: 'relative', width, height: ITEM_H * 3, flexShrink: 0 }}>
      {/* Highlight band around selected item */}
      <div style={{
        position: 'absolute', top: ITEM_H, left: 0, right: 0, height: ITEM_H,
        borderTop: '1px solid var(--border-2)', borderBottom: '1px solid var(--border-2)',
        pointerEvents: 'none', zIndex: 1,
      }} />
      {/* Fade out items above/below selection */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H,
        background: 'linear-gradient(to bottom, var(--surface-2), transparent)',
        pointerEvents: 'none', zIndex: 2,
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H,
        background: 'linear-gradient(to top, var(--surface-2), transparent)',
        pointerEvents: 'none', zIndex: 2,
      }} />
      {/* Scrollable drum column */}
      <div
        ref={ref}
        onScroll={handleScroll}
        className="tp-scroll"
        style={{
          height: '100%',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
        } as React.CSSProperties}
      >
        <div style={{ height: ITEM_H }} />
        {items.map((item, i) => (
          <div
            key={item}
            onClick={() => {
              setLocalIdx(i)
              onChange(item)
              ref.current?.scrollTo({ top: i * ITEM_H, behavior: 'smooth' })
            }}
            style={{
              height: ITEM_H,
              scrollSnapAlign: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: i === localIdx ? 28 : 18,
              fontWeight: i === localIdx ? 900 : 400,
              color: i === localIdx ? 'var(--text)' : 'var(--text-3)',
              transition: 'font-size 0.1s, color 0.1s',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            {item}
          </div>
        ))}
        <div style={{ height: ITEM_H }} />
      </div>
    </div>
  )
}

interface Props {
  value: string // "HH:MM" 24-hour
  onChange: (v: string) => void
}

export default function TimePicker({ value, onChange }: Props) {
  const parts = (value || '22:00').split(':')
  const hNum = parseInt(parts[0], 10) || 0
  const mNum = parseInt(parts[1], 10) || 0
  const isAm = hNum < 12
  const h12 = hNum === 0 ? 12 : hNum > 12 ? hNum - 12 : hNum

  const hours12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

  function setHour(h12Str: string) {
    const h12n = parseInt(h12Str, 10)
    const h24 = isAm ? (h12n === 12 ? 0 : h12n) : (h12n === 12 ? 12 : h12n + 12)
    onChange(`${String(h24).padStart(2, '0')}:${String(mNum).padStart(2, '0')}`)
  }

  function setMinute(mStr: string) {
    onChange(`${String(hNum).padStart(2, '0')}:${mStr}`)
  }

  function setAmPm(v: string) {
    const nowAm = v === 'AM'
    const h24 = nowAm ? (h12 === 12 ? 0 : h12) : (h12 === 12 ? 12 : h12 + 12)
    onChange(`${String(h24).padStart(2, '00')}:${String(mNum).padStart(2, '0')}`)
  }

  return (
    <>
      {/* Hide scrollbar in WebKit (iOS Safari) */}
      <style>{`.tp-scroll::-webkit-scrollbar { display: none; }`}</style>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--surface-2)', borderRadius: 16,
        border: '1px solid var(--border-2)', padding: '0 12px',
      }}>
        <Col items={hours12} value={String(h12).padStart(2, '0')} onChange={setHour} width={72} />
        <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', padding: '0 4px', flexShrink: 0 }}>:</span>
        <Col items={minutes} value={String(mNum).padStart(2, '0')} onChange={setMinute} width={72} />
        <div style={{ width: 10, flexShrink: 0 }} />
        <Col items={['AM', 'PM']} value={isAm ? 'AM' : 'PM'} onChange={setAmPm} width={52} />
      </div>
    </>
  )
}
