'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('anvil-cookie-consent')
    if (!consent) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem('anvil-cookie-consent', 'accepted')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 px-4 pb-2">
      <div className="max-w-xl mx-auto rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
        <p className="text-xs flex-1 leading-relaxed" style={{ color: 'var(--text-2)' }}>
          We use session cookies to keep you logged in. No tracking or advertising.{' '}
          <Link href="/cookies" className="underline" style={{ color: 'var(--green)' }}>Cookie Policy</Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={accept}
            className="px-4 py-2 rounded-xl text-xs font-bold"
            style={{ background: 'var(--green)', color: '#000' }}
          >
            Accept
          </button>
          <Link
            href="/cookies"
            className="px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-2)' }}
          >
            Learn More
          </Link>
        </div>
      </div>
    </div>
  )
}
