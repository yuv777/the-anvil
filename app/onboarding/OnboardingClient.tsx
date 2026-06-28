'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const CATEGORY_COLORS: Record<string, string> = {
  physical:   'var(--cat-physical)',
  mental:     'var(--cat-mental)',
  confidence: 'var(--cat-confidence)',
  spiritual:  'var(--cat-spiritual)',
  lifestyle:  'var(--cat-lifestyle)',
}

const questions = [
  {
    category: 'physical',
    label: 'Physical',
    question: 'How many push-ups can you do in one go?',
    options: [
      { label: 'Beginner — 0 to 10', tier: 1 },
      { label: 'Intermediate — 11 to 30', tier: 2 },
      { label: 'Advanced — 31 to 50', tier: 3 },
      { label: 'Elite — 50+', tier: 4 },
    ],
  },
  {
    category: 'mental',
    label: 'Mental',
    question: 'How many books did you read last year?',
    options: [
      { label: '0 books', tier: 1 },
      { label: '1 to 3 books', tier: 2 },
      { label: '4 to 10 books', tier: 3 },
      { label: '10+ books', tier: 4 },
    ],
  },
  {
    category: 'confidence',
    label: 'Confidence',
    question: 'How comfortable are you speaking in public?',
    options: [
      { label: 'Very uncomfortable', tier: 1 },
      { label: 'Somewhat uncomfortable', tier: 2 },
      { label: 'Comfortable', tier: 3 },
      { label: 'Very comfortable', tier: 4 },
    ],
  },
  {
    category: 'spiritual',
    label: 'Spiritual',
    question: 'How often do you meditate or practice mindfulness?',
    options: [
      { label: 'Never', tier: 1 },
      { label: 'Rarely', tier: 2 },
      { label: 'Weekly', tier: 3 },
      { label: 'Daily', tier: 4 },
    ],
  },
  {
    category: 'lifestyle',
    label: 'Lifestyle',
    question: 'How organized is your daily routine?',
    options: [
      { label: 'Chaotic', tier: 1 },
      { label: 'Somewhat organized', tier: 2 },
      { label: 'Organized', tier: 3 },
      { label: 'Highly structured', tier: 4 },
    ],
  },
]

export default function OnboardingClient({ userId }: { userId: string }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const current = questions[step]
  const isLast = step === questions.length - 1
  const catColor = CATEGORY_COLORS[current.category]

  async function handleNext() {
    if (selected === null) return

    const newAnswers = { ...answers, [current.category]: selected }
    setAnswers(newAnswers)

    if (!isLast) {
      setStep(step + 1)
      setSelected(null)
      return
    }

    setSaving(true)
    setError('')

    const supabase = createClient()

    const physicalTier   = newAnswers['physical'] ?? 1
    const mentalTier     = newAnswers['mental'] ?? 1
    const confidenceTier = newAnswers['confidence'] ?? 1
    const spiritualTier  = newAnswers['spiritual'] ?? 1
    const lifestyleTier  = newAnswers['lifestyle'] ?? 1

    const { error: dbError } = await supabase
      .from('user_skill_levels')
      .upsert({
        user_id: userId,
        physical_tier:   physicalTier,
        mental_tier:     mentalTier,
        confidence_tier: confidenceTier,
        spiritual_tier:  spiritualTier,
        lifestyle_tier:  lifestyleTier,
        current_tier: Math.round((physicalTier + mentalTier + confidenceTier + spiritualTier + lifestyleTier) / 5),
        completed_onboarding: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (dbError) {
      setError(dbError.message)
      setSaving(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const progress = ((step + 1) / questions.length) * 100

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <div className="text-2xl mb-4">⚒</div>
          <h1 className="text-xl font-black tracking-[0.15em] uppercase" style={{ color: 'var(--text)' }}>Calibrate</h1>
          <p className="text-xs uppercase tracking-widest mt-2" style={{ color: 'var(--text-2)' }}>5 questions to set your level</p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-xs mb-2.5" style={{ color: 'var(--text-2)' }}>
            <span style={{ color: catColor }} className="font-semibold uppercase tracking-wider">{current.label}</span>
            <span>{step + 1} / {questions.length}</span>
          </div>
          <div className="h-px rounded-full overflow-hidden" style={{ background: 'var(--border-2)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: catColor }}
            />
          </div>
        </div>

        <div className="rounded-2xl p-8 fade-in-up" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-semibold text-center mb-8 leading-snug" style={{ color: 'var(--text)' }}>
            {current.question}
          </h2>

          {error && (
            <div className="text-red-400 text-sm px-4 py-3 rounded-xl mb-4" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)' }}>
              {error}
            </div>
          )}

          <div className="space-y-2.5 mb-7">
            {current.options.map((opt) => {
              const isSelected = selected === opt.tier
              return (
                <button
                  key={opt.tier}
                  onClick={() => setSelected(opt.tier)}
                  className="w-full text-left px-5 py-4 rounded-xl transition-all duration-150 flex items-center gap-3.5"
                  style={{
                    background: isSelected ? `${catColor}12` : 'var(--surface-2)',
                    border: `1px solid ${isSelected ? catColor : 'var(--border-2)'}`,
                    color: isSelected ? catColor : 'var(--text)',
                  }}
                >
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0 border-2 flex items-center justify-center"
                    style={{ borderColor: isSelected ? catColor : 'var(--border-2)' }}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full" style={{ background: catColor }} />}
                  </span>
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              )
            })}
          </div>

          <button
            onClick={handleNext}
            disabled={selected === null || saving}
            className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-opacity disabled:opacity-30"
            style={{ background: catColor, color: '#000' }}
          >
            {saving ? 'Saving…' : isLast ? 'Start Training' : 'Continue'}
          </button>
        </div>

        <div className="flex justify-center gap-2 mt-6">
          {questions.map((q, i) => (
            <div
              key={i}
              className="h-0.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 24 : 12,
                background: i < step
                  ? CATEGORY_COLORS[q.category]
                  : i === step
                  ? catColor
                  : 'var(--border-2)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
