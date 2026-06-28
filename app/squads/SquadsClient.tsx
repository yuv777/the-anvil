'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import BottomNav from '@/app/components/BottomNav'

interface Squad {
  id: string
  name: string
  description: string
  join_code: string
  squad_members?: { count: number }[]
}

interface Props {
  userId: string
  mySquads: Squad[]
  allSquads: Squad[]
}

export default function SquadsClient({ userId, mySquads, allSquads }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'mine' | 'all' | 'create' | 'join'>('mine')
  const [squadName, setSquadName] = useState('')
  const [description, setDescription] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function createSquad(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const supabase = createClient()
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { data: squad, error: err } = await supabase
      .from('squads')
      .insert({ name: squadName, description, created_by: userId, join_code: code })
      .select()
      .single()

    if (err || !squad) {
      setError(err?.message || 'Failed to create squad')
      setLoading(false)
      return
    }

    await supabase.from('squad_members').insert({ squad_id: squad.id, user_id: userId })

    setMessage(`Squad created — join code: ${code}`)
    setSquadName('')
    setDescription('')
    setLoading(false)
    router.refresh()
  }

  async function joinSquad(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const supabase = createClient()

    const { data: squad } = await supabase
      .from('squads')
      .select('id, name')
      .eq('join_code', inviteCode.toUpperCase())
      .single()

    if (!squad) {
      setError('Invalid join code')
      setLoading(false)
      return
    }

    const { error: err } = await supabase
      .from('squad_members')
      .insert({ squad_id: squad.id, user_id: userId })

    if (err) {
      setError(err.message.includes('duplicate') ? 'Already a member' : err.message)
      setLoading(false)
      return
    }

    setMessage(`Joined ${squad.name}`)
    setInviteCode('')
    setLoading(false)
    router.refresh()
  }

  const tabs = [
    { key: 'mine', label: 'My Squads' },
    { key: 'all', label: 'Browse' },
    { key: 'create', label: 'Create' },
    { key: 'join', label: 'Join' },
  ] as const

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>

      {/* Nav */}
      <nav className="px-5 py-4 flex items-center justify-between max-w-xl mx-auto" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span>⚒</span>
          <span className="text-xs font-black tracking-[0.15em] uppercase" style={{ color: 'var(--text)' }}>The Anvil</span>
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/dashboard" className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Dashboard</Link>
          <Link href="/profile" className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Profile</Link>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-5 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Squads</h1>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-2)' }}>Train together, rise together.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setError(''); setMessage('') }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
              style={{
                background: tab === t.key ? 'var(--green)' : 'var(--surface)',
                color: tab === t.key ? '#000' : 'var(--text-2)',
                border: `1px solid ${tab === t.key ? 'transparent' : 'var(--border)'}`,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Feedback */}
        {error && (
          <div className="text-red-400 text-sm px-4 py-3 rounded-xl mb-4" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)' }}>
            {error}
          </div>
        )}
        {message && (
          <div className="text-sm px-4 py-3 rounded-xl mb-4" style={{ color: 'var(--green)', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)' }}>
            {message}
          </div>
        )}

        {/* My Squads */}
        {tab === 'mine' && (
          <div className="space-y-2.5">
            {mySquads.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: 'var(--text-2)' }}>No squads yet.</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Create or join one to get started.</p>
              </div>
            ) : mySquads.map((squad) => (
              <Link
                key={squad.id}
                href={`/squads/${squad.id}`}
                className="block rounded-2xl p-4 transition-colors"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{squad.name}</div>
                    {squad.description && (
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{squad.description}</div>
                    )}
                    <div className="text-xs mt-1.5 font-mono" style={{ color: 'var(--text-3)' }}>{squad.join_code}</div>
                  </div>
                  <span style={{ color: 'var(--text-3)' }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Browse */}
        {tab === 'all' && (
          <div className="space-y-2.5">
            {allSquads.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: 'var(--text-2)' }}>No squads yet.</p>
              </div>
            ) : allSquads.map((squad) => {
              const count = squad.squad_members?.[0]?.count || 0
              return (
                <Link
                  key={squad.id}
                  href={`/squads/${squad.id}`}
                  className="block rounded-2xl p-4 transition-colors"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{squad.name}</div>
                      {squad.description && (
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{squad.description}</div>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>{count} members</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Create */}
        {tab === 'create' && (
          <form onSubmit={createSquad} className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Create a Squad</h3>
            <div>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-2)' }}>Name</label>
              <input
                value={squadName}
                onChange={(e) => setSquadName(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }}
                placeholder="Iron Brotherhood"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-2)' }}>Description <span style={{ color: 'var(--text-3)' }}>(optional)</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none resize-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }}
                placeholder="Elite warriors only"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-opacity disabled:opacity-40"
              style={{ background: 'var(--green)', color: '#000' }}
            >
              {loading ? 'Creating…' : 'Create Squad'}
            </button>
          </form>
        )}

        {/* Join */}
        {tab === 'join' && (
          <form onSubmit={joinSquad} className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Join with Code</h3>
            <div>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-2)' }}>Join Code</label>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                maxLength={6}
                className="w-full px-4 py-4 rounded-xl font-mono text-center text-2xl tracking-[0.3em] focus:outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }}
                placeholder="ABC123"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-opacity disabled:opacity-40"
              style={{ background: 'var(--gold)', color: '#000' }}
            >
              {loading ? 'Joining…' : 'Join Squad'}
            </button>
          </form>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
