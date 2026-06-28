'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import BottomNav from '@/app/components/BottomNav'
import { PROGRAMS, Program } from '@/lib/programs'
import { ChevronRight, CheckCircle2, Lock, Flame, Trophy } from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'
import Link from 'next/link'

interface Enrollment {
  id: string
  user_id: string
  program_id: string
  current_day: number
  started_at: string
  completed_at: string | null
}

interface DayCompletion {
  id: string
  user_id: string
  program_id: string
  day_number: number
  completed_at: string
}

interface Props {
  userId: string
  today: string
  enrollments: Enrollment[]
  completions: DayCompletion[]
}

const CATEGORY_COLORS: Record<string, string> = {
  physical:   'var(--cat-physical)',
  mental:     'var(--cat-mental)',
  confidence: 'var(--cat-confidence)',
  spiritual:  'var(--cat-spiritual)',
  lifestyle:  'var(--cat-lifestyle)',
}

const DURATION_COLORS: Record<number, string> = {
  21: '#60a5fa',
  30: '#c084fc',
}

export default function ChallengesClient({ userId, today, enrollments, completions }: Props) {
  const supabase = createClient()
  const [enrollmentMap, setEnrollmentMap] = useState<Record<string, Enrollment>>(
    Object.fromEntries(enrollments.map(e => [e.program_id, e]))
  )
  const [completionSet, setCompletionSet] = useState<Set<string>>(
    new Set(completions.map(c => `${c.program_id}:${c.day_number}`))
  )
  const [activeProgram, setActiveProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const enrolled = Object.values(enrollmentMap)
  const activeEnrollments = enrolled.filter(e => !e.completed_at)
  const completedEnrollments = enrolled.filter(e => e.completed_at)

  async function enroll(program: Program) {
    setLoading(program.id)
    const { data, error } = await supabase
      .from('user_programs')
      .insert({ user_id: userId, program_id: program.id, current_day: 1, started_at: today })
      .select()
      .single()
    if (!error && data) {
      setEnrollmentMap(m => ({ ...m, [program.id]: data }))
    }
    setLoading(null)
  }

  async function completeDay(program: Program, dayNumber: number) {
    const key = `${program.id}:${dayNumber}`
    if (completionSet.has(key)) return
    setLoading(`${program.id}-day`)

    await supabase.from('user_program_days').insert({
      user_id: userId,
      program_id: program.id,
      day_number: dayNumber,
      completed_at: new Date().toISOString(),
    })

    const nextDay = dayNumber + 1
    const isFinished = dayNumber >= program.durationDays

    if (isFinished) {
      await supabase
        .from('user_programs')
        .update({ completed_at: new Date().toISOString(), current_day: dayNumber })
        .eq('user_id', userId)
        .eq('program_id', program.id)
      setEnrollmentMap(m => ({
        ...m,
        [program.id]: { ...m[program.id], completed_at: new Date().toISOString(), current_day: dayNumber }
      }))
    } else {
      await supabase
        .from('user_programs')
        .update({ current_day: nextDay })
        .eq('user_id', userId)
        .eq('program_id', program.id)
      setEnrollmentMap(m => ({
        ...m,
        [program.id]: { ...m[program.id], current_day: nextDay }
      }))
    }

    setCompletionSet(s => new Set([...s, key]))
    setLoading(null)
  }

  function getDaysSinceStart(enrollment: Enrollment) {
    return differenceInDays(new Date(today), parseISO(enrollment.started_at))
  }

  if (activeProgram) {
    const enrollment = enrollmentMap[activeProgram.id]
    const currentDay = enrollment?.current_day || 1
    const todayKey = `${activeProgram.id}:${currentDay}`
    const todayDone = completionSet.has(todayKey)
    const todayTask = activeProgram.days.find(d => d.day === currentDay)
    const catColor = CATEGORY_COLORS[activeProgram.category] || 'var(--text-2)'
    const daysCompleted = currentDay - 1
    const progress = Math.round((daysCompleted / activeProgram.durationDays) * 100)

    return (
      <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
        <nav className="px-5 py-4 flex items-center justify-between max-w-xl mx-auto" style={{ borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => setActiveProgram(null)} className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-2)' }}>
            ← Back
          </button>
          <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{activeProgram.icon} {activeProgram.title}</span>
          <div />
        </nav>

        <main className="max-w-xl mx-auto px-5 py-6">
          {/* Progress bar */}
          <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-3)' }}>Day {currentDay} of {activeProgram.durationDays}</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{progress}% complete</p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>Streak</p>
                <p className="text-lg font-bold" style={{ color: catColor }}>{daysCompleted}d</p>
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-2)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: catColor }}
              />
            </div>
          </div>

          {/* Today's task */}
          {todayTask && !enrollment?.completed_at && (
            <div className="rounded-2xl p-5 mb-4" style={{ background: todayDone ? 'rgba(34,197,94,0.06)' : 'var(--surface)', border: `1px solid ${todayDone ? 'rgba(34,197,94,0.25)' : 'var(--border)'}` }}>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>Today's Challenge</p>
              <p className="text-sm font-medium leading-relaxed mb-4" style={{ color: 'var(--text)' }}>{todayTask.task}</p>
              {todayDone ? (
                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--green)' }}>
                  <CheckCircle2 size={16} />
                  Completed — well done.
                </div>
              ) : (
                <button
                  onClick={() => completeDay(activeProgram, currentDay)}
                  disabled={loading === `${activeProgram.id}-day`}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                  style={{ background: catColor, color: '#fff' }}
                >
                  {loading === `${activeProgram.id}-day` ? 'Saving...' : 'Mark Complete'}
                </button>
              )}
            </div>
          )}

          {enrollment?.completed_at && (
            <div className="rounded-2xl p-6 mb-4 text-center" style={{ background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.25)' }}>
              <p className="text-3xl mb-2">🏆</p>
              <p className="text-base font-bold mb-1" style={{ color: '#c9a227' }}>Program Complete</p>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>You finished {activeProgram.title}. Legendary.</p>
            </div>
          )}

          {/* All days list */}
          <h3 className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>All Days</h3>
          <div className="space-y-2">
            {activeProgram.days.map(d => {
              const key = `${activeProgram.id}:${d.day}`
              const done = completionSet.has(key)
              const isCurrent = d.day === currentDay
              const isLocked = d.day > currentDay && !enrollment?.completed_at

              return (
                <div
                  key={d.day}
                  className="flex items-start gap-3 rounded-2xl p-4"
                  style={{
                    background: done ? 'rgba(34,197,94,0.04)' : isCurrent ? 'var(--surface)' : 'var(--surface)',
                    border: `1px solid ${done ? 'rgba(34,197,94,0.15)' : isCurrent ? catColor + '50' : 'var(--border)'}`,
                    opacity: isLocked ? 0.45 : 1,
                  }}
                >
                  <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: done ? 'var(--green)' : isCurrent ? catColor : 'var(--surface-2)', color: done || isCurrent ? '#fff' : 'var(--text-3)' }}>
                    {done ? '✓' : isLocked ? <Lock size={11} /> : d.day}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-3)' }}>Day {d.day}</p>
                    <p className="text-xs leading-relaxed" style={{ color: done ? 'var(--text-2)' : isCurrent ? 'var(--text)' : 'var(--text-2)' }}>{d.task}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      <nav className="px-5 py-4 flex items-center justify-between max-w-xl mx-auto" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span>⚒</span>
          <span className="text-xs font-black tracking-[0.15em] uppercase" style={{ color: 'var(--text)' }}>The Anvil</span>
        </Link>
        <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>Challenges</span>
      </nav>

      <main className="max-w-xl mx-auto px-5 py-6">

        {/* Active programs */}
        {activeEnrollments.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--text-3)' }}>
              <Flame size={12} style={{ color: 'var(--green)' }} />
              In Progress
            </h2>
            <div className="space-y-3">
              {activeEnrollments.map(e => {
                const prog = PROGRAMS.find(p => p.id === e.program_id)
                if (!prog) return null
                const progress = Math.round(((e.current_day - 1) / prog.durationDays) * 100)
                const catColor = CATEGORY_COLORS[prog.category] || 'var(--text-2)'
                const todayDone = completionSet.has(`${prog.id}:${e.current_day}`)

                return (
                  <button
                    key={e.id}
                    onClick={() => setActiveProgram(prog)}
                    className="w-full rounded-2xl p-5 text-left transition-all active:scale-[0.99]"
                    style={{ background: 'var(--surface)', border: `1px solid ${catColor}35` }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl">{prog.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text)' }}>{prog.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>Day {e.current_day} of {prog.durationDays}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {todayDone && <CheckCircle2 size={14} style={{ color: 'var(--green)' }} />}
                        <ChevronRight size={14} style={{ color: 'var(--text-3)' }} />
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-2)' }}>
                      <div className="h-full rounded-full" style={{ width: `${progress}%`, background: catColor }} />
                    </div>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>{progress}% complete{todayDone ? ' · Today done ✓' : ' · Tap for today\'s task'}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Completed */}
        {completedEnrollments.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--text-3)' }}>
              <Trophy size={12} style={{ color: '#c9a227' }} />
              Completed
            </h2>
            <div className="space-y-2">
              {completedEnrollments.map(e => {
                const prog = PROGRAMS.find(p => p.id === e.program_id)
                if (!prog) return null
                return (
                  <button
                    key={e.id}
                    onClick={() => setActiveProgram(prog)}
                    className="w-full flex items-center gap-3 rounded-2xl p-4 text-left"
                    style={{ background: 'rgba(201,162,39,0.05)', border: '1px solid rgba(201,162,39,0.18)' }}
                  >
                    <span className="text-xl">{prog.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{prog.title}</p>
                      <p className="text-xs" style={{ color: '#c9a227' }}>Completed · {prog.durationDays} days</p>
                    </div>
                    <Trophy size={14} style={{ color: '#c9a227' }} />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* All programs */}
        <div>
          <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>Programs</h2>
          <div className="space-y-3">
            {PROGRAMS.map(program => {
              const enrollment = enrollmentMap[program.id]
              const isEnrolled = !!enrollment
              const isCompleted = !!enrollment?.completed_at
              const catColor = CATEGORY_COLORS[program.category] || 'var(--text-2)'
              const durationColor = DURATION_COLORS[program.durationDays] || 'var(--text-2)'

              return (
                <div
                  key={program.id}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--surface)', border: `1px solid var(--border)` }}
                >
                  {/* Header */}
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-3xl">{program.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{program.title}</h3>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-2)' }}>{program.subtitle}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: catColor + '18', color: catColor }}>
                            {program.category}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: durationColor + '18', color: durationColor }}>
                            {program.durationDays} days
                          </span>
                          {isCompleted && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(201,162,39,0.12)', color: '#c9a227' }}>
                              ✓ Completed
                            </span>
                          )}
                          {isEnrolled && !isCompleted && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--green)' }}>
                              Active · Day {enrollment.current_day}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Preview of first few days */}
                    <div className="space-y-1.5 mb-4">
                      {program.days.slice(0, 3).map(d => (
                        <div key={d.day} className="flex items-start gap-2">
                          <span className="text-[10px] font-bold mt-0.5 w-8 shrink-0" style={{ color: 'var(--text-3)' }}>D{d.day}</span>
                          <p className="text-[11px] leading-snug" style={{ color: 'var(--text-2)' }}>{d.task}</p>
                        </div>
                      ))}
                      <p className="text-[10px] ml-10" style={{ color: 'var(--text-3)' }}>+{program.durationDays - 3} more days...</p>
                    </div>

                    {isEnrolled ? (
                      <button
                        onClick={() => setActiveProgram(program)}
                        className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                        style={{ background: catColor + '18', color: catColor, border: `1px solid ${catColor}35` }}
                      >
                        {isCompleted ? 'View Program' : 'Continue →'}
                      </button>
                    ) : (
                      <button
                        onClick={() => enroll(program)}
                        disabled={loading === program.id}
                        className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                        style={{ background: catColor, color: '#fff' }}
                      >
                        {loading === program.id ? 'Starting...' : 'Start Program'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
