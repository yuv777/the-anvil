'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import SwipeableTask from './SwipeableTask'
import BottomNav from '@/app/components/BottomNav'
import TaskTimer, { extractSeconds } from '@/app/components/TaskTimer'
import { Snowflake } from 'lucide-react'
import { getAchievementsToAward, ACHIEVEMENTS } from '@/lib/achievements'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { scheduleTaskReminder } from '@/lib/notifications'

const TIER_LABELS = ['', 'Iron', 'Steel', 'Bronze', 'Gold']
const TIER_COLORS = ['', '#9ca3af', '#94a3b8', '#c97316', '#c9a227']
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

interface Task {
  id: string
  category: string
  activityName: string
  value: string
  emoji: string
  completed: boolean
  dailyTaskId: string
  activityId: string
}

interface WeekDay { date: string; completed: number; total: number }

interface Props {
  username: string
  tasks: Task[]
  taskError: string | null
  currentStreak: number
  longestStreak: number
  overallTier: number
  skillLevels: Record<string, number>
  perfectDays: Record<string, number>
  daysUntilUpgrade: number
  userId: string
  streakFreezes: number
  lastCompletionDate: string | null
  weeklyStats: WeekDay[]
  perfectDaysThisWeek: number
}

export default function DashboardClient({
  username, tasks: initialTasks, taskError, currentStreak, longestStreak,
  overallTier, skillLevels, perfectDays, daysUntilUpgrade, userId,
  streakFreezes: initialFreezes, lastCompletionDate, weeklyStats, perfectDaysThisWeek,
}: Props) {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const [completing, setCompleting] = useState<string | null>(null)
  const [tierUpCategory, setTierUpCategory] = useState<string | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set())
  const [hintDismissed, setHintDismissed] = useState(false)
  const [freezes, setFreezes] = useState(initialFreezes)
  const [freezeLoading, setFreezeLoading] = useState(false)
  const [freezeUsed, setFreezeUsed] = useState(false)
  const [activeTimer, setActiveTimer]       = useState<{ taskName: string; seconds: number } | null>(null)
  const [newAchievement, setNewAchievement] = useState<{ name: string; icon: string } | null>(null)

  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  const allDone = completedCount === totalCount && totalCount > 0

  // Schedule / cancel evening reminder whenever task state changes
  useEffect(() => {
    const remaining = totalCount - completedCount
    const remindAt = new Date()
    remindAt.setHours(20, 0, 0, 0) // 8 PM today
    if (remindAt <= new Date()) return // already past 8pm
    scheduleTaskReminder(remaining, remindAt).catch(() => {})
  }, [completedCount, totalCount])

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const canFreeze = freezes > 0 && currentStreak > 0
    && lastCompletionDate !== today && lastCompletionDate !== yesterday
    && !freezeUsed

  function handleSkip(taskId: string) {
    setSkippedIds((prev) => new Set([...prev, taskId]))
    setHintDismissed(true)
  }

  async function useStreakFreeze() {
    if (!canFreeze || freezeLoading) return
    setFreezeLoading(true)
    const supabase = createClient()
    const [{ error: streakErr }, { error: freezeErr }] = await Promise.all([
      supabase.from('user_streaks')
        .upsert({ user_id: userId, last_completion_date: yesterday, current_streak: currentStreak, longest_streak: longestStreak })
        .eq('user_id', userId),
      supabase.from('user_skill_levels')
        .update({ streak_freezes: Math.max(0, freezes - 1) })
        .eq('user_id', userId),
    ])
    setFreezeLoading(false)
    if (!streakErr && !freezeErr) {
      setFreezes(f => Math.max(0, f - 1))
      setFreezeUsed(true)
    }
  }

  async function checkAndAwardAchievements(supabase: any, completedTasks: Task[], streak: number, tier: number, levels: Record<string, number>) {
    const { data: already } = await supabase.from('user_achievements').select('achievement_id').eq('user_id', userId)
    const earnedIds = new Set<string>((already || []).map((r: any) => r.achievement_id as string))
    const taskNames = completedTasks.filter(t => t.completed).map(t => t.activityName)
    const toAward = getAchievementsToAward({
      currentStreak: streak, longestStreak: streak, overallTier: tier,
      skillLevels: levels, completedTasksToday: taskNames.length,
      perfectDaysThisWeek: 0, taskNames, earnedIds,
    })
    if (toAward.length === 0) return
    await supabase.from('user_achievements').upsert(
      toAward.map(id => ({ user_id: userId, achievement_id: id })),
      { onConflict: 'user_id,achievement_id' }
    )
    // Show each unlocked achievement one after another
    for (let i = 0; i < toAward.length; i++) {
      const ach = ACHIEVEMENTS.find(a => a.id === toAward[i])
      if (!ach) continue
      setTimeout(() => {
        setNewAchievement({ name: ach.name, icon: ach.icon })
        setTimeout(() => setNewAchievement(null), 3000)
      }, i * 3500)
    }
    router.refresh()
  }

  async function toggleTask(task: Task) {
    if (completing) return
    setCompleting(task.dailyTaskId)
    const supabase = createClient()
    const newCompleted = !task.completed
    await supabase.from('user_daily_tasks').update({ completed: newCompleted }).eq('id', task.dailyTaskId)
    const updatedTasks = tasks.map((t) =>
      t.dailyTaskId === task.dailyTaskId ? { ...t, completed: newCompleted } : t
    )
    setTasks(updatedTasks)
    if (newCompleted) {
      Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {})
      const isPerfectDay = updatedTasks.filter(t => t.completed).length === totalCount
      // Update streak first so achievement check sees the correct streak value
      let latestStreak = currentStreak
      if (isPerfectDay) {
        Haptics.notification({ type: NotificationType.Success }).catch(() => {})
        latestStreak = await handlePerfectDay(supabase, updatedTasks)
      }
      await checkAndAwardAchievements(supabase, updatedTasks, latestStreak, overallTier, skillLevels)
    }
    setCompleting(null)
  }

  async function handlePerfectDay(supabase: any, _currentTasks: Task[]): Promise<number> {
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 3000)
    const todayStr = new Date().toISOString().split('T')[0]
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const { data: streakRow } = await supabase.from('user_streaks').select('*').eq('user_id', userId).maybeSingle()
    if (streakRow?.last_completion_date === todayStr) return streakRow.current_streak
    const isConsecutive = streakRow?.last_completion_date === yesterdayStr
    const newStreak  = isConsecutive ? (streakRow?.current_streak  || 0) + 1 : 1
    const newLongest = Math.max(newStreak, streakRow?.longest_streak || 0)
    if (streakRow) {
      await supabase.from('user_streaks')
        .update({ current_streak: newStreak, longest_streak: newLongest, last_completion_date: todayStr })
        .eq('user_id', userId)
    } else {
      await supabase.from('user_streaks')
        .insert({ user_id: userId, current_streak: newStreak, longest_streak: newLongest, last_completion_date: todayStr })
    }
    const { data: skillRow } = await supabase.from('user_skill_levels').select('*').eq('user_id', userId).single()
    const newPerfectDays = (skillRow?.perfect_days_in_tier || 0) + 1
    const currentTier = skillRow?.current_tier || 1
    if (newPerfectDays >= 7 && currentTier < 4) {
      const nextTier = currentTier + 1
      await supabase.from('user_skill_levels').update({
        current_tier: nextTier,
        physical_tier:    Math.min(4, (skillRow?.physical_tier    || 1) + 1),
        mental_tier:      Math.min(4, (skillRow?.mental_tier      || 1) + 1),
        confidence_tier:  Math.min(4, (skillRow?.confidence_tier  || 1) + 1),
        spiritual_tier:   Math.min(4, (skillRow?.spiritual_tier   || 1) + 1),
        lifestyle_tier:   Math.min(4, (skillRow?.lifestyle_tier   || 1) + 1),
        perfect_days_in_tier: 0, updated_at: new Date().toISOString(),
      }).eq('user_id', userId)
      setTierUpCategory('all')
      setTimeout(() => { setTierUpCategory(null); router.refresh() }, 4000)
    } else {
      await supabase.from('user_skill_levels')
        .update({ perfect_days_in_tier: newPerfectDays, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
    }
    return newStreak
  }

  const tierColor = TIER_COLORS[overallTier] || TIER_COLORS[1]
  const tierLabel = TIER_LABELS[overallTier] || 'Iron'

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>

      {activeTimer && (
        <TaskTimer
          taskName={activeTimer.taskName}
          totalSeconds={activeTimer.seconds}
          onClose={() => setActiveTimer(null)}
        />
      )}

      {newAchievement && (
        <div className="fixed top-5 left-0 right-0 flex justify-center z-50 px-5 pointer-events-none">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg"
            style={{ background: 'var(--surface)', border: '1px solid var(--gold)', color: 'var(--text)' }}>
            <span className="text-2xl">{newAchievement.icon}</span>
            <div>
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--gold)' }}>Achievement Unlocked</p>
              <p className="text-sm font-bold mt-0.5">{newAchievement.name}</p>
            </div>
          </div>
        </div>
      )}

      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-center celebration">
            <div className="text-7xl">🔥</div>
            <div className="text-xl font-black mt-2" style={{ color: 'var(--green)' }}>Perfect Day</div>
          </div>
        </div>
      )}

      {tierUpCategory && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="text-center celebration rounded-2xl p-10" style={{ background: 'var(--surface)', border: `1px solid ${tierColor}` }}>
            <div className="text-6xl mb-3">👑</div>
            <div className="text-2xl font-black" style={{ color: tierColor }}>Tier Up</div>
            <div className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>All categories upgraded</div>
          </div>
        </div>
      )}

      <nav className="px-5 py-4 flex items-center justify-between max-w-xl mx-auto" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <span>⚒</span>
          <span className="text-xs font-black tracking-[0.15em] uppercase" style={{ color: 'var(--text)' }}>The Anvil</span>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-5 py-8">

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>Welcome back</p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{username}</h1>
        </div>

        {/* Weekly summary */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>This Week</span>
            <span className="text-xs font-semibold" style={{ color: perfectDaysThisWeek >= 5 ? 'var(--green)' : 'var(--text-2)' }}>
              {perfectDaysThisWeek}/7 perfect
            </span>
          </div>
          <div className="flex justify-between gap-1">
            {weeklyStats.map((day, i) => {
              const isPerfect = day.total >= 5 && day.completed === day.total
              const isPartial = day.completed > 0 && !isPerfect
              const isMissed  = day.total > 0 && day.completed === 0
              const isToday   = day.date === today
              let dotBg = 'var(--border-2)'
              if (isPerfect) dotBg = 'var(--green)'
              else if (isPartial) dotBg = 'var(--gold)'
              else if (isMissed) dotBg = '#f87171'
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-full transition-all"
                    style={{ height: 6, background: dotBg, opacity: day.total === 0 ? 0.25 : 1 }}
                  />
                  <span className="text-[9px] font-medium" style={{ color: isToday ? 'var(--text)' : 'var(--text-3)' }}>
                    {DAY_LETTERS[i]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { value: tierLabel, label: 'Tier', color: tierColor },
            { value: currentStreak, label: 'Streak', color: 'var(--text)', suffix: 'd' },
            { value: longestStreak, label: 'Best', color: 'var(--text)', suffix: 'd' },
          ].map(({ value, label, color, suffix }) => (
            <div key={label} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-base font-bold" style={{ color }}>
                {value}{suffix && <span className="text-xs font-normal ml-0.5" style={{ color: 'var(--text-3)' }}>{suffix}</span>}
              </div>
              <div className="text-xs uppercase tracking-wider mt-1" style={{ color: 'var(--text-3)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Streak Freeze */}
        {freezes > 0 && (
          <div className="rounded-2xl px-4 py-3 mb-4 flex items-center justify-between"
            style={{ background: canFreeze ? 'rgba(96,165,250,0.06)' : 'var(--surface)', border: `1px solid ${canFreeze ? 'rgba(96,165,250,0.2)' : 'var(--border)'}` }}>
            <div className="flex items-center gap-2.5">
              <Snowflake size={14} style={{ color: '#60a5fa' }} />
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                  {freezes} freeze{freezes !== 1 ? 's' : ''} available
                </span>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                  {canFreeze ? 'Streak at risk — protect it now' : freezeUsed ? 'Freeze used for today' : 'Streak is safe'}
                </p>
              </div>
            </div>
            {canFreeze && (
              <button
                onClick={useStreakFreeze}
                disabled={freezeLoading}
                className="text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-40"
                style={{ background: '#60a5fa', color: '#000' }}
              >
                {freezeLoading ? '…' : 'Use'}
              </button>
            )}
          </div>
        )}

        {/* Progress */}
        <div className="rounded-2xl p-5 mb-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Today</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {completedCount}<span style={{ color: 'var(--text-3)' }}>/{totalCount}</span>
            </span>
          </div>
          <div className="h-px rounded-full overflow-hidden" style={{ background: 'var(--border-2)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--green-2), var(--green))' }} />
          </div>
          {allDone && <p className="text-xs font-semibold mt-3" style={{ color: 'var(--green)' }}>Perfect day — +1 toward tier upgrade</p>}
          {!allDone && daysUntilUpgrade > 0 && overallTier < 4 && (
            <p className="text-xs mt-3" style={{ color: 'var(--text-3)' }}>{daysUntilUpgrade} perfect days until tier upgrade</p>
          )}
          {overallTier >= 4 && <p className="text-xs font-semibold mt-3" style={{ color: 'var(--gold)' }}>Max tier achieved</p>}
        </div>

        {/* Tasks */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Tasks</h2>
            {!hintDismissed && tasks.some((t) => !t.completed) && (
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>swipe to complete</span>
            )}
          </div>

          {tasks.filter((t) => !skippedIds.has(t.dailyTaskId)).map((task) => {
            const timerSecs = extractSeconds(task.value)
            return (
              <SwipeableTask
                key={task.dailyTaskId} task={task} completing={completing === task.dailyTaskId}
                onToggle={() => { setHintDismissed(true); toggleTask(task) }}
                onSkip={() => handleSkip(task.dailyTaskId)}
                onTimer={timerSecs ? () => setActiveTimer({ taskName: task.activityName, seconds: timerSecs }) : undefined}
              />
            )
          })}

          {skippedIds.size > 0 && (
            <div className="mt-6">
              <h3 className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>Skipped</h3>
              {tasks.filter((t) => skippedIds.has(t.dailyTaskId)).map((task) => (
                <div key={task.dailyTaskId} className="flex items-center gap-3.5 p-4 rounded-2xl mb-2 opacity-30"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="w-6 h-6 rounded-full border-2 flex-shrink-0" style={{ borderColor: 'var(--border-2)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>{task.activityName}</div>
                    <div className="text-xs capitalize mt-0.5" style={{ color: 'var(--text-3)' }}>{task.category}</div>
                  </div>
                  <button onClick={() => setSkippedIds((prev) => { const next = new Set(prev); next.delete(task.dailyTaskId); return next })}
                    className="text-xs underline" style={{ color: 'var(--text-3)' }}>undo</button>
                </div>
              ))}
            </div>
          )}

          {tasks.length === 0 && (
            <div className="text-center py-12">
              <div className="text-3xl mb-4">⚒</div>
              {taskError === 'EMPTY_LIBRARY' ? (
                <><p className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>Activity library is empty</p>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>Run the seed SQL in Supabase to populate your tasks.</p></>
              ) : taskError ? (
                <><p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-2)' }}>Could not load tasks</p>
                  <p className="text-xs font-mono px-4 py-2 rounded-xl break-all" style={{ color: '#f87171', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>{taskError}</p></>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>No tasks generated. Try refreshing.</p>
              )}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
