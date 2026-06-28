'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Share2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import BottomNav from '@/app/components/BottomNav'
import { ACHIEVEMENTS, RARITY_COLORS } from '@/lib/achievements'

const CATEGORY_COLORS: Record<string, string> = {
  physical:   'var(--cat-physical)',
  mental:     'var(--cat-mental)',
  confidence: 'var(--cat-confidence)',
  spiritual:  'var(--cat-spiritual)',
  lifestyle:  'var(--cat-lifestyle)',
}

const TIER_LABELS = ['', 'Iron', 'Steel', 'Bronze', 'Gold']
const TIER_COLORS = ['', '#9ca3af', '#94a3b8', '#c97316', '#c9a227']

interface Skill {
  category: string
  current_tier: number
  perfect_days_in_tier: number
}

interface Props {
  username: string
  email: string
  skills: Skill[]
  currentStreak: number
  longestStreak: number
  perfectDaysInTier: number
  earnedAchievements: { achievement_id: string; earned_at: string }[]
}

export default function ProfileClient({ username, email, skills, currentStreak, longestStreak, perfectDaysInTier, earnedAchievements }: Props) {
  const earnedIds = new Set(earnedAchievements.map(a => a.achievement_id))
  const earnedMap = Object.fromEntries(earnedAchievements.map(a => [a.achievement_id, a.earned_at]))
  const router = useRouter()

  const shareStreakCard = useCallback(async () => {
    const W = 1080, H = 1080
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!

    // Background
    ctx.fillStyle = '#080808'
    ctx.fillRect(0, 0, W, H)

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 1
    for (let x = 0; x < W; x += 72) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
    for (let y = 0; y < H; y += 72) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

    // Card frame
    const pad = 80
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 32)
    ctx.stroke()

    // Glow
    const glow = ctx.createRadialGradient(W / 2, H * 0.35, 0, W / 2, H * 0.35, W * 0.55)
    glow.addColorStop(0, 'rgba(34,197,94,0.12)')
    glow.addColorStop(1, 'rgba(34,197,94,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)

    // App name
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.font = '700 28px system-ui, -apple-system, sans-serif'
    ctx.letterSpacing = '0.15em'
    ctx.textAlign = 'center'
    ctx.fillText('THE ANVIL', W / 2, 210)

    // Streak number
    ctx.fillStyle = '#22c55e'
    ctx.font = `700 ${currentStreak >= 100 ? '220' : '280'}px system-ui, -apple-system, sans-serif`
    ctx.letterSpacing = '0'
    ctx.textAlign = 'center'
    ctx.fillText(String(currentStreak), W / 2, H / 2 + 80)

    // 'DAY STREAK' label
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.font = '600 52px system-ui, -apple-system, sans-serif'
    ctx.letterSpacing = '0.2em'
    ctx.fillText('DAY STREAK', W / 2, H / 2 + 170)

    // Username
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.font = `700 46px system-ui, -apple-system, sans-serif`
    ctx.letterSpacing = '0'
    ctx.fillText(`@${username}`, W / 2, H - 230)

    // Tier badge
    const overallTier = skills.length > 0 ? Math.round(skills.reduce((a, s) => a + s.current_tier, 0) / skills.length) : 1
    const tierLabel = TIER_LABELS[overallTier] || 'Iron'
    const tierColor = TIER_COLORS[overallTier] || TIER_COLORS[1]
    ctx.fillStyle = tierColor
    ctx.font = '600 36px system-ui, -apple-system, sans-serif'
    ctx.fillText(`${tierLabel} Tier`, W / 2, H - 170)

    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], 'streak.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: `${currentStreak} day streak on The Anvil` }); return }
        catch { /* fall through to download */ }
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'anvil-streak.png'; a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }, [username, currentStreak, skills])

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const overallTier = skills.length > 0
    ? Math.round(skills.reduce((a, s) => a + s.current_tier, 0) / skills.length)
    : 1

  const tierColor = TIER_COLORS[overallTier] || TIER_COLORS[1]
  const tierLabel = TIER_LABELS[overallTier] || 'Iron'

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
          <Link href="/squads" className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Squads</Link>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-5 py-8">

        {/* Identity card */}
        <div className="rounded-2xl p-6 mb-5 flex items-center gap-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black uppercase" style={{ background: 'var(--surface-2)', color: tierColor, border: '1px solid var(--border-2)' }}>
            {username.slice(0, 2)}
          </div>
          <div>
            <h1 className="text-base font-bold" style={{ color: 'var(--text)' }}>{username}</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{email}</p>
            <p className="text-xs font-semibold mt-1" style={{ color: tierColor }}>{tierLabel} Tier</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { value: currentStreak, label: 'Streak', suffix: ' days', color: 'var(--text)' },
            { value: longestStreak, label: 'Best', suffix: ' days', color: 'var(--text)' },
            { value: perfectDaysInTier, label: 'Tier Progress', suffix: '/7', color: 'var(--green)' },
          ].map(({ value, label, suffix, color }) => (
            <div key={label} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-base font-bold" style={{ color }}>
                {value}<span className="text-xs font-normal" style={{ color: 'var(--text-3)' }}>{suffix}</span>
              </div>
              <div className="text-xs uppercase tracking-wider mt-1" style={{ color: 'var(--text-3)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Share streak card */}
        {currentStreak > 0 && (
          <button
            onClick={shareStreakCard}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl mb-5 text-sm font-semibold transition-all active:scale-95"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: 'var(--green)' }}
          >
            <Share2 size={16} />
            Share {currentStreak}-Day Streak Card
          </button>
        )}

        {/* Category tiers */}
        <div className="mb-6">
          <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>Categories</h2>
          <div className="space-y-2.5">
            {skills.map((skill) => {
              const catColor = CATEGORY_COLORS[skill.category] || 'var(--text-2)'
              const tColor = TIER_COLORS[skill.current_tier] || TIER_COLORS[1]
              const tLabel = TIER_LABELS[skill.current_tier] || 'Iron'
              const prog = (skill.perfect_days_in_tier / 7) * 100

              return (
                <div key={skill.category} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: catColor }} />
                      <span className="text-sm font-semibold capitalize" style={{ color: 'var(--text)' }}>{skill.category}</span>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: tColor }}>{tLabel}</span>
                  </div>
                  {skill.current_tier < 4 ? (
                    <>
                      <div className="h-px rounded-full overflow-hidden" style={{ background: 'var(--border-2)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, prog)}%`, background: catColor }} />
                      </div>
                      <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
                        {skill.perfect_days_in_tier}/7 perfect days to next tier
                      </p>
                    </>
                  ) : (
                    <p className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>Max tier reached</p>
                  )}
                </div>
              )
            })}

            {skills.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: 'var(--text-2)' }}>Complete onboarding to see your levels.</p>
                <Link href="/onboarding" className="text-xs font-semibold mt-2 inline-block" style={{ color: 'var(--green)' }}>
                  Go to onboarding →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Achievements */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Achievements</h2>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>
              {earnedIds.size}/{ACHIEVEMENTS.length}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {ACHIEVEMENTS.map(ach => {
              const earned = earnedIds.has(ach.id)
              const color = RARITY_COLORS[ach.rarity]
              return (
                <div
                  key={ach.id}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl"
                  style={{
                    background: earned ? `${color}12` : 'var(--surface)',
                    border: `1px solid ${earned ? `${color}35` : 'var(--border)'}`,
                    opacity: earned ? 1 : 0.35,
                  }}
                  title={`${ach.name}: ${ach.desc}`}
                >
                  <span className="text-2xl" style={{ filter: earned ? 'none' : 'grayscale(1)' }}>{ach.icon}</span>
                  <span className="text-[9px] font-semibold text-center leading-tight" style={{ color: earned ? color : 'var(--text-3)' }}>
                    {ach.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full py-3.5 rounded-xl text-sm font-semibold transition-colors"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
        >
          Sign Out
        </button>
      </main>
      <BottomNav />
    </div>
  )
}
