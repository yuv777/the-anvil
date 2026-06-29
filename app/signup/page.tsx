'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    router.push('/onboarding')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">

        <div className="text-center mb-12">
          <div className="text-2xl mb-5">⚒</div>
          <h1 className="text-xl font-black tracking-[0.15em] uppercase" style={{ color: 'var(--text)' }}>The Anvil</h1>
          <p className="text-xs uppercase tracking-[0.2em] mt-2" style={{ color: 'var(--text-2)' }}>Begin your journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-red-400 text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)' }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-2)' }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              className="w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none transition-colors"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', color: 'var(--text)' }}
              placeholder="ironforge"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-2)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none transition-colors"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', color: 'var(--text)' }}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-2)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none transition-colors"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', color: 'var(--text)' }}
              placeholder="••••••••"
            />
          </div>

          {/* Consent */}
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="sr-only"
              />
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center transition-colors"
                style={{ background: agreed ? 'var(--green)' : 'var(--surface)', border: `1px solid ${agreed ? 'var(--green)' : 'var(--border-2)'}` }}
              >
                {agreed && <span className="text-black text-xs font-bold">✓</span>}
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
              I am 18 or older and I agree to the{' '}
              <Link href="/terms" className="underline" style={{ color: 'var(--green)' }}>Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="underline" style={{ color: 'var(--green)' }}>Privacy Policy</Link>
            </p>
          </label>

          <button
            type="submit"
            disabled={loading || !agreed}
            className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-opacity disabled:opacity-40"
            style={{ background: 'var(--green)', color: '#000' }}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>

          <p className="text-center text-sm pt-1" style={{ color: 'var(--text-2)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold" style={{ color: 'var(--green)' }}>
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
