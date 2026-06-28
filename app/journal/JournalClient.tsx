'use client'

import { useState, useMemo, useEffect } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase'
import BottomNav from '@/app/components/BottomNav'
import { Save, ChevronDown, ChevronUp } from 'lucide-react'

const MOODS = [
  { val: 1, emoji: '😞', label: 'Rough' },
  { val: 2, emoji: '😕', label: 'Low' },
  { val: 3, emoji: '😐', label: 'Okay' },
  { val: 4, emoji: '🙂', label: 'Good' },
  { val: 5, emoji: '😤', label: 'Locked In' },
]

const PROMPTS = [
  'What did you do today that your future self will thank you for?',
  'What is one thing you want to do better tomorrow?',
  'What are you most proud of this week?',
  'What is holding you back right now, and what can you do about it?',
  'Who do you want to become? Describe him in detail.',
  'What uncomfortable thing did you do today?',
  'What lesson did today teach you?',
  'Where did you waste time or energy today?',
]

interface Entry {
  id: string
  date: string
  content: string
  mood: number | null
}

interface Props {
  userId: string
  entries: Entry[]
}

export default function JournalClient({ userId, entries: initialEntries }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayEntry = initialEntries.find(e => e.date === today)

  const [content, setContent]         = useState(todayEntry?.content || '')
  const [mood, setMood]               = useState<number | null>(todayEntry?.mood || null)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [saveError, setSaveError]     = useState<string | null>(null)
  const [entries, setEntries]         = useState(initialEntries)
  const [expandedId, setExpandedId]   = useState<string | null>(null)
  const prompt = useMemo(() => PROMPTS[new Date().getDay() % PROMPTS.length], [])

  async function save() {
    if (!content.trim()) return
    setSaving(true)
    setSaveError(null)
    const payload = {
      user_id: userId,
      date: today,
      content: content.trim(),
      mood: mood ?? null,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase
      .from('journal_entries')
      .upsert(payload, { onConflict: 'user_id,date' })
    setSaving(false)
    if (error) {
      setSaveError(error.message)
      return
    }
    // Re-fetch the saved row so we have the id
    const { data: saved_row } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single()
    if (saved_row) {
      setEntries(prev => {
        const without = prev.filter(e => e.date !== today)
        return [saved_row as Entry, ...without]
      })
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const pastEntries = entries

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--bg)' }}>
      <nav className="px-5 py-4 flex items-center justify-between max-w-xl mx-auto" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <span>⚒</span>
          <span className="text-xs font-black tracking-[0.15em] uppercase" style={{ color: 'var(--text)' }}>Journal</span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>{format(new Date(), 'EEE, d MMM')}</span>
      </nav>

      <main className="max-w-xl mx-auto px-5 py-6">

        {/* Today's entry */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>Today</p>

          {/* Prompt */}
          <p className="text-xs italic mb-3 leading-relaxed" style={{ color: 'var(--text-2)' }}>"{prompt}"</p>

          {/* Mood */}
          <div className="flex gap-2 mb-4">
            {MOODS.map(m => (
              <button
                key={m.val}
                onClick={() => setMood(prev => prev === m.val ? null : m.val)}
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-xs transition-all"
                style={{
                  background: mood === m.val ? 'rgba(34,197,94,0.1)' : 'var(--surface-2)',
                  border: `1px solid ${mood === m.val ? 'rgba(34,197,94,0.35)' : 'var(--border-2)'}`,
                  color: mood === m.val ? 'var(--green)' : 'var(--text-3)',
                }}
              >
                <span className="text-lg">{m.emoji}</span>
                <span className="text-[10px] hidden sm:block">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Text area */}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write anything. This is just for you."
            rows={7}
            className="w-full resize-none text-sm leading-relaxed focus:outline-none rounded-xl p-3"
            style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border-2)', fontFamily: 'inherit' }}
          />

          <button
            onClick={save}
            disabled={saving || !content.trim()}
            className="mt-3 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm disabled:opacity-40 transition-opacity"
            style={{ background: saved ? 'rgba(34,197,94,0.15)' : 'var(--green)', color: saved ? 'var(--green)' : '#000', border: saved ? '1px solid rgba(34,197,94,0.3)' : 'none' }}
          >
            <Save size={15} />
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Entry'}
          </button>

          {saveError && (
            <div className="mt-2 px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              {saveError.includes('does not exist')
                ? 'Table not found — run the SQL migration in Supabase first.'
                : saveError}
            </div>
          )}
        </div>

        {/* Past entries */}
        {pastEntries.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>Entries</p>
            <div className="space-y-2">
              {pastEntries.map(entry => {
                const isOpen = expandedId === entry.id
                const moodObj = MOODS.find(m => m.val === entry.mood)
                return (
                  <div key={entry.id} className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <button
                      className="w-full flex items-center justify-between px-4 py-3.5"
                      onClick={() => setExpandedId(isOpen ? null : entry.id)}
                    >
                      <div className="flex items-center gap-3">
                        {moodObj && <span className="text-lg">{moodObj.emoji}</span>}
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                              {format(new Date(entry.date + 'T00:00:00'), 'EEE d MMM')}
                            </p>
                            {entry.date === today && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--green)' }}>Today</span>
                            )}
                          </div>
                          {!isOpen && (
                            <p className="text-xs mt-0.5 truncate max-w-[220px]" style={{ color: 'var(--text-3)' }}>
                              {entry.content}
                            </p>
                          )}
                        </div>
                      </div>
                      {isOpen ? <ChevronUp size={14} style={{ color: 'var(--text-3)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-3)' }} />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4">
                        <div className="h-px mb-3" style={{ background: 'var(--border)' }} />
                        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-2)' }}>
                          {entry.content}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {pastEntries.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>Your past entries will appear here.</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Write every day. Watch who you become.</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
