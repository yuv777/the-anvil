'use client'

import { useState, useEffect } from 'react'
import { X, Check, Zap } from 'lucide-react'
import { getOfferings, purchasePackage, restorePurchases } from '@/lib/revenuecat'

const FREE_FEATURES = [
  'Daily tasks & streak tracking',
  'Journal entries',
  'Squads & leaderboards',
  'Basic stats',
]

const PRO_FEATURES = [
  'Everything in Free',
  'Guided Programs (30/75/90-day)',
  'Weekly Progress Reports',
  'Progress Photos',
  'Full Achievement system',
  'Analytics & body tracking',
]

interface Props {
  onClose: () => void
  onSubscribed: () => void
}

export default function Paywall({ onClose, onSubscribed }: Props) {
  const [offerings, setOfferings] = useState<any>(null)
  const [selected, setSelected] = useState<'weekly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getOfferings().then(setOfferings)
  }, [])

  const weeklyPkg = offerings?.availablePackages?.find((p: any) =>
    p.packageType === 'WEEKLY' || p.identifier?.includes('weekly')
  )
  const yearlyPkg = offerings?.availablePackages?.find((p: any) =>
    p.packageType === 'ANNUAL' || p.identifier?.includes('yearly') || p.identifier?.includes('annual')
  )

  async function handlePurchase() {
    const pkg = selected === 'weekly' ? weeklyPkg : yearlyPkg
    if (!pkg) { setError('Products not available yet. Please try again later.'); return }
    setLoading(true)
    setError('')
    try {
      const success = await purchasePackage(pkg)
      if (success) onSubscribed()
    } catch (e: any) {
      if (!e?.userCancelled) setError('Purchase failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRestore() {
    setLoading(true)
    const success = await restorePurchases()
    setLoading(false)
    if (success) onSubscribed()
    else setError('No previous purchase found.')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-xl rounded-t-3xl pb-10 pt-6 px-6" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Zap size={18} style={{ color: 'var(--green)' }} />
            <span className="font-black text-sm uppercase tracking-widest" style={{ color: 'var(--green)' }}>The Anvil Pro</span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-3)' }}><X size={20} /></button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border-2)' }}>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>Free</p>
            {FREE_FEATURES.map(f => (
              <div key={f} className="flex items-start gap-2 mb-2">
                <Check size={12} className="mt-0.5 shrink-0" style={{ color: 'var(--text-3)' }} />
                <span className="text-xs" style={{ color: 'var(--text-2)' }}>{f}</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-4" style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.25)' }}>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--green)' }}>Pro</p>
            {PRO_FEATURES.map(f => (
              <div key={f} className="flex items-start gap-2 mb-2">
                <Check size={12} className="mt-0.5 shrink-0" style={{ color: 'var(--green)' }} />
                <span className="text-xs" style={{ color: 'var(--text)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan selector */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => setSelected('weekly')}
            className="rounded-2xl p-4 text-left transition-all"
            style={{
              background: selected === 'weekly' ? 'rgba(74,222,128,0.08)' : 'var(--surface)',
              border: `1px solid ${selected === 'weekly' ? 'var(--green)' : 'var(--border-2)'}`,
            }}
          >
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>Weekly</p>
            <p className="text-lg font-black" style={{ color: 'var(--text)' }}>£2</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>per week</p>
          </button>
          <button
            onClick={() => setSelected('yearly')}
            className="rounded-2xl p-4 text-left transition-all relative"
            style={{
              background: selected === 'yearly' ? 'rgba(74,222,128,0.08)' : 'var(--surface)',
              border: `1px solid ${selected === 'yearly' ? 'var(--green)' : 'var(--border-2)'}`,
            }}
          >
            <div className="absolute -top-2 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'var(--green)', color: '#000' }}>SAVE 42%</div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>Yearly</p>
            <p className="text-lg font-black" style={{ color: 'var(--text)' }}>£60</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>per year · £1.15/wk</p>
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-400 mb-3 text-center">{error}</p>
        )}

        {/* CTA */}
        <button
          onClick={handlePurchase}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-black text-sm tracking-wide disabled:opacity-50 mb-3"
          style={{ background: 'var(--green)', color: '#000' }}
        >
          {loading ? 'Processing…' : `Start ${selected === 'weekly' ? '£2/week' : '£60/year'}`}
        </button>

        <button
          onClick={handleRestore}
          disabled={loading}
          className="w-full text-xs text-center"
          style={{ color: 'var(--text-3)' }}
        >
          Restore previous purchase
        </button>

        <p className="text-center text-[10px] mt-3" style={{ color: 'var(--text-3)' }}>
          Cancel anytime · Billed through Apple
        </p>
      </div>
    </div>
  )
}
