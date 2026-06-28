'use client'

import { useState } from 'react'
import Link from 'next/link'
import BottomNav from '@/app/components/BottomNav'
import { createClient } from '@/lib/supabase'
import { Trophy, Swords, Users, Plus, CheckCircle2, X } from 'lucide-react'

interface LeaderboardEntry {
  user_id: string
  username: string
  current_streak: number
  longest_streak: number
  active_today: boolean
}

interface SquadChallenge {
  id: string
  title: string
  description: string
  ends_at: string | null
  created_by: string
  completions: string[]
}

interface Props {
  squad: { id: string; name: string; description: string | null; join_code: string }
  leaderboard: LeaderboardEntry[]
  activeTodayCount: number
  isMember: boolean
  currentUserId: string
  initialChallenges: SquadChallenge[]
}

type Tab = 'leaderboard' | 'hall' | 'challenges'

export default function SquadDetailClient({ squad, leaderboard, activeTodayCount, isMember, currentUserId, initialChallenges }: Props) {
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('leaderboard')
  const [challenges, setChallenges] = useState<SquadChallenge[]>(initialChallenges)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newEnds, setNewEnds] = useState('')
  const [saving, setSaving] = useState(false)

  const hallOfFame = [...leaderboard].sort((a, b) => b.longest_streak - a.longest_streak)

  async function addChallenge() {
    if (!newTitle.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('squad_challenges')
      .insert({
        squad_id: squad.id,
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        ends_at: newEnds || null,
        created_by: currentUserId,
      })
      .select()
      .single()
    if (!error && data) {
      setChallenges(prev => [...prev, { ...data, completions: [] }])
      setNewTitle(''); setNewDesc(''); setNewEnds('')
      setShowAdd(false)
    }
    setSaving(false)
  }

  async function toggleChallengeComplete(challengeId: string) {
    const challenge = challenges.find(c => c.id === challengeId)
    if (!challenge) return
    const alreadyDone = challenge.completions.includes(currentUserId)

    if (alreadyDone) {
      await supabase.from('squad_challenge_completions')
        .delete().eq('challenge_id', challengeId).eq('user_id', currentUserId)
      setChallenges(prev => prev.map(c => c.id === challengeId
        ? { ...c, completions: c.completions.filter(id => id !== currentUserId) }
        : c))
    } else {
      await supabase.from('squad_challenge_completions')
        .insert({ challenge_id: challengeId, user_id: currentUserId })
      setChallenges(prev => prev.map(c => c.id === challengeId
        ? { ...c, completions: [...c.completions, currentUserId] }
        : c))
    }
  }

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: 'leaderboard', label: 'Live', icon: Users },
    { id: 'hall',        label: 'Hall of Fame', icon: Trophy },
    { id: 'challenges',  label: 'Challenges', icon: Swords },
  ]

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      <nav className="px-5 py-4 flex items-center justify-between max-w-xl mx-auto" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span>⚒</span>
          <span className="text-xs font-black tracking-[0.15em] uppercase" style={{ color: 'var(--text)' }}>The Anvil</span>
        </Link>
        <Link href="/squads" className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>← Squads</Link>
      </nav>

      <main className="max-w-xl mx-auto px-5 py-6">
        {/* Squad header */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{squad.name}</h1>
          {squad.description && <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{squad.description}</p>}
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>
              Code: <span style={{ color: 'var(--gold)' }}>{squad.join_code}</span>
            </span>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>{leaderboard.length} member{leaderboard.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {!isMember && (
          <div className="rounded-2xl p-4 mb-4 text-sm" style={{ background: 'rgba(201,162,39,0.07)', border: '1px solid rgba(201,162,39,0.2)', color: 'var(--gold)' }}>
            You&apos;re not a member of this squad.{' '}
            <Link href="/squads" className="underline">Join here →</Link>
          </div>
        )}

        {/* Active today banner */}
        {leaderboard.length > 0 && (
          <div className="rounded-2xl px-4 py-3 mb-4 flex items-center gap-2.5" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              {activeTodayCount === 0 ? 'No one has completed today\'s tasks yet' :
               activeTodayCount === leaderboard.length ? 'Everyone has completed today\'s tasks!' :
               `${activeTodayCount} of ${leaderboard.length} members active today`}
            </span>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: 'var(--surface)' }}>
          {tabs.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: tab === id ? 'var(--green)' : 'transparent', color: tab === id ? '#000' : 'var(--text-3)' }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Leaderboard tab ── */}
        {tab === 'leaderboard' && (
          <div className="space-y-2">
            {leaderboard.length === 0 ? (
              <div className="text-center py-12"><p className="text-sm" style={{ color: 'var(--text-2)' }}>No members yet.</p></div>
            ) : leaderboard.map((entry, i) => {
              const isMe = entry.user_id === currentUserId
              const rank = i + 1
              return (
                <div key={entry.user_id} className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{ background: isMe ? 'rgba(34,197,94,0.04)' : 'var(--surface)', border: `1px solid ${isMe ? 'rgba(34,197,94,0.2)' : rank === 1 ? 'rgba(201,162,39,0.2)' : 'var(--border)'}` }}>
                  <div className="w-7 text-center shrink-0">
                    {rank === 1 ? <span className="text-lg">👑</span> : rank === 2 ? <span className="text-base">🥈</span> : rank === 3 ? <span className="text-base">🥉</span> : <span className="text-xs font-bold" style={{ color: 'var(--text-3)' }}>#{rank}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: isMe ? 'var(--green)' : 'var(--text)' }}>{entry.username}</span>
                      {isMe && <span className="text-xs" style={{ color: 'var(--text-3)' }}>you</span>}
                      {entry.active_today && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>active</span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Best: {entry.longest_streak} days</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-black" style={{ color: entry.current_streak > 0 ? 'var(--green)' : 'var(--text-3)' }}>{entry.current_streak}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>day streak</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Hall of Fame tab ── */}
        {tab === 'hall' && (
          <div>
            <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>All-time longest streaks in this squad.</p>
            <div className="space-y-2">
              {hallOfFame.filter(e => e.longest_streak > 0).map((entry, i) => {
                const isMe = entry.user_id === currentUserId
                const rank = i + 1
                const medals = ['🥇', '🥈', '🥉']
                return (
                  <div key={entry.user_id} className="flex items-center gap-4 p-4 rounded-2xl"
                    style={{ background: isMe ? 'rgba(201,162,39,0.05)' : 'var(--surface)', border: `1px solid ${rank === 1 ? 'rgba(201,162,39,0.3)' : 'var(--border)'}` }}>
                    <div className="w-8 text-center shrink-0">
                      {rank <= 3 ? <span className="text-xl">{medals[rank - 1]}</span> : <span className="text-xs font-bold" style={{ color: 'var(--text-3)' }}>#{rank}</span>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: isMe ? '#c9a227' : 'var(--text)' }}>{entry.username}</span>
                        {isMe && <span className="text-xs" style={{ color: 'var(--text-3)' }}>you</span>}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Current: {entry.current_streak} days</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-black" style={{ color: rank === 1 ? '#c9a227' : 'var(--text)' }}>{entry.longest_streak}</p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>day best</p>
                    </div>
                  </div>
                )
              })}
              {hallOfFame.every(e => e.longest_streak === 0) && (
                <div className="text-center py-10">
                  <p className="text-2xl mb-2">🏛️</p>
                  <p className="text-sm" style={{ color: 'var(--text-2)' }}>No records yet. Build your streak to claim a spot.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Squad Challenges tab ── */}
        {tab === 'challenges' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Squad-wide challenges. Everyone tracks their own completion.</p>
              {isMember && (
                <button onClick={() => setShowAdd(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ background: 'var(--green)', color: '#000' }}>
                  <Plus size={12} /> Add
                </button>
              )}
            </div>

            {/* Add challenge modal */}
            {showAdd && (
              <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                <div className="w-full max-w-xl rounded-t-3xl p-6 pb-10" style={{ background: 'var(--surface)', border: '1px solid var(--border-2)' }}>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>New Challenge</h3>
                    <button onClick={() => setShowAdd(false)} style={{ color: 'var(--text-3)' }}><X size={18} /></button>
                  </div>
                  <div className="space-y-3 mb-5">
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>Title</label>
                      <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. 30-day no drinking"
                        className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }} />
                    </div>
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>Description (optional)</label>
                      <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="What does completing this look like?" rows={2}
                        className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }} />
                    </div>
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>End date (optional)</label>
                      <input type="date" value={newEnds} onChange={e => setNewEnds(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }} />
                    </div>
                  </div>
                  <button onClick={addChallenge} disabled={saving || !newTitle.trim()}
                    className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-40"
                    style={{ background: 'var(--green)', color: '#000' }}>
                    {saving ? 'Creating...' : 'Create Challenge'}
                  </button>
                </div>
              </div>
            )}

            {/* Challenge list */}
            <div className="space-y-3">
              {challenges.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-2xl mb-2">⚔️</p>
                  <p className="text-sm" style={{ color: 'var(--text-2)' }}>No challenges yet.</p>
                  {isMember && <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Create one to push the squad.</p>}
                </div>
              ) : challenges.map(challenge => {
                const iDone = challenge.completions.includes(currentUserId)
                const doneCount = challenge.completions.length
                const total = leaderboard.length
                const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0
                const isExpired = challenge.ends_at ? new Date(challenge.ends_at) < new Date() : false

                return (
                  <div key={challenge.id} className="rounded-2xl p-5"
                    style={{ background: 'var(--surface)', border: `1px solid ${iDone ? 'rgba(34,197,94,0.25)' : isExpired ? 'var(--border)' : 'var(--border)'}`, opacity: isExpired ? 0.65 : 1 }}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{challenge.title}</h3>
                        {challenge.description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{challenge.description}</p>}
                        {challenge.ends_at && (
                          <p className="text-xs mt-1" style={{ color: isExpired ? '#ef4444' : 'var(--text-3)' }}>
                            {isExpired ? 'Ended' : 'Ends'} {new Date(challenge.ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </p>
                        )}
                      </div>
                      {isMember && !isExpired && (
                        <button onClick={() => toggleChallengeComplete(challenge.id)}
                          className="shrink-0 p-2 rounded-xl transition-all"
                          style={{ background: iDone ? 'rgba(34,197,94,0.15)' : 'var(--surface-2)', border: `1px solid ${iDone ? 'rgba(34,197,94,0.3)' : 'var(--border-2)'}` }}>
                          <CheckCircle2 size={18} style={{ color: iDone ? 'var(--green)' : 'var(--text-3)' }} />
                        </button>
                      )}
                    </div>
                    {/* Completion progress */}
                    <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: 'var(--border-2)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--green)' }} />
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{doneCount}/{total} members completed · {pct}%</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
