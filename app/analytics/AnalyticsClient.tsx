'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, startOfWeek, endOfWeek, eachDayOfInterval as eachDay } from 'date-fns'
import { CheckCircle2, Flame, Star, TrendingUp, ChevronLeft, ChevronRight, Camera, X, Maximize2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, CartesianGrid,
} from 'recharts'
import BottomNav from '@/app/components/BottomNav'
import { createClient } from '@/lib/supabase'

const CATEGORIES = ['physical', 'mental', 'confidence', 'spiritual', 'lifestyle'] as const
const CAT_COLORS: Record<string, string> = {
  physical:   '#22c55e',
  mental:     '#3b82f6',
  confidence: '#f59e0b',
  spiritual:  '#8b5cf6',
  lifestyle:  '#ec4899',
}
const CAT_LABELS: Record<string, string> = {
  physical: 'Physical', mental: 'Mental', confidence: 'Confidence',
  spiritual: 'Spiritual', lifestyle: 'Lifestyle',
}
const TIER_LABELS = ['', 'Iron', 'Steel', 'Bronze', 'Gold']
const TIER_COLORS = ['', '#9ca3af', '#94a3b8', '#c97316', '#c9a227']

interface Task {
  date: string
  category: string
  completed: boolean
  base_task?: string
  task_text?: string
}

interface BodyMetric {
  date: string
  weight_kg: number | null
  sleep_hours: number | null
  water_glasses: number | null
  mood: number | null
}

interface Props {
  recentTasks: Task[]
  allTasks: { category: string; completed: boolean }[]
  streak: any
  skillRow: any
  bodyMetrics: BodyMetric[]
  userId: string
}

function heatColor(completed: number, total: number) {
  if (total === 0) return 'var(--surface-2)'
  if (completed === 0) return 'rgba(239,68,68,0.25)'
  if (completed <= 2) return 'rgba(251,191,36,0.3)'
  if (completed <= 4) return 'rgba(34,197,94,0.3)'
  return 'rgba(139,92,246,0.4)'
}

function heatBorder(completed: number, total: number) {
  if (total === 0) return 'transparent'
  if (completed === 0) return 'rgba(239,68,68,0.4)'
  if (completed <= 2) return 'rgba(251,191,36,0.5)'
  if (completed <= 4) return 'rgba(34,197,94,0.4)'
  return 'rgba(139,92,246,0.6)'
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--text-2)' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {CAT_LABELS[p.name] || p.name}: {p.value ?? '—'}{typeof p.value === 'number' && p.name !== 'count' ? '%' : ''}
        </p>
      ))}
    </div>
  )
}

const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }}>
      <p className="font-semibold" style={{ color: 'var(--text)' }}>{label}</p>
      <p style={{ color: 'var(--green)' }}>{payload[0].value} completions</p>
    </div>
  )
}

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}>
      <p style={{ color: payload[0].payload.fill }}>{payload[0].name}: {payload[0].value}</p>
    </div>
  )
}

export default function AnalyticsClient({ recentTasks, allTasks, streak, skillRow, bodyMetrics: initMetrics, userId }: Props) {
  const [mounted, setMounted] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<{ date: string; tasks: Task[] } | null>(null)
  const [activeTab, setActiveTab] = useState<'performance' | 'body' | 'weekly'>('performance')

  // ── Body metrics state ──
  const [metrics, setMetrics] = useState<BodyMetric[]>(initMetrics)
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayMetric = metrics.find(m => m.date === todayStr)
  const [weight, setWeight]   = useState(String(todayMetric?.weight_kg   ?? ''))
  const [sleep, setSleep]     = useState(String(todayMetric?.sleep_hours  ?? ''))
  const [water, setWater]     = useState(String(todayMetric?.water_glasses ?? ''))
  const [mood, setMood]       = useState<number>(todayMetric?.mood ?? 0)
  const [savingMetrics, setSavingMetrics] = useState(false)
  const [metricsSaved, setMetricsSaved]   = useState(false)

  // ── Progress photos state ──
  interface ProgressPhoto { id: string; date: string; label: string; url: string }
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [photoLabel, setPhotoLabel] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState<ProgressPhoto | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadPhotos() {
      const supabase = createClient()
      const { data } = await supabase.from('progress_photos').select('*').eq('user_id', userId).order('date', { ascending: false })
      if (data) setPhotos(data as ProgressPhoto[])
    }
    loadPhotos()
  }, [userId])

  async function uploadPhoto(file: File) {
    setUploadingPhoto(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${userId}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('progress-photos').upload(path, file)
    if (upErr) { setUploadingPhoto(false); return }
    const { data: urlData } = supabase.storage.from('progress-photos').getPublicUrl(path)
    const dateStr = format(new Date(), 'yyyy-MM-dd')
    const { data: row } = await supabase.from('progress_photos')
      .insert({ user_id: userId, date: dateStr, label: photoLabel.trim() || dateStr, url: urlData.publicUrl })
      .select().single()
    if (row) setPhotos(prev => [row as ProgressPhoto, ...prev])
    setPhotoLabel('')
    setUploadingPhoto(false)
  }

  async function saveMetrics() {
    setSavingMetrics(true)
    const supabase = createClient()
    const payload = {
      user_id: userId, date: todayStr,
      weight_kg:     weight     ? parseFloat(weight)  : null,
      sleep_hours:   sleep      ? parseFloat(sleep)   : null,
      water_glasses: water      ? parseInt(water)      : null,
      mood:          mood > 0   ? mood                 : null,
    }
    const { data, error } = await supabase.from('body_metrics').upsert(payload, { onConflict: 'user_id,date' }).select().single()
    setSavingMetrics(false)
    if (!error && data) {
      setMetrics(prev => {
        const filtered = prev.filter(m => m.date !== todayStr)
        return [...filtered, data as BodyMetric].sort((a, b) => a.date.localeCompare(b.date))
      })
      setMetricsSaved(true)
      setTimeout(() => setMetricsSaved(false), 2000)
    }
  }

  useEffect(() => { setMounted(true) }, [])

  // ── Daily map (recent 90 days) ──────────────────────────────────────────────
  const dailyMap = useMemo(() => {
    const map: Record<string, { total: number; completed: number; byCategory: Record<string, boolean>; tasks: Task[] }> = {}
    for (const t of recentTasks) {
      if (!map[t.date]) map[t.date] = { total: 0, completed: 0, byCategory: {}, tasks: [] }
      map[t.date].total++
      map[t.date].tasks.push(t)
      if (t.completed) {
        map[t.date].completed++
        map[t.date].byCategory[t.category] = true
      }
    }
    return map
  }, [recentTasks])

  // ── Summary stats ───────────────────────────────────────────────────────────
  const totalCompleted = useMemo(() => allTasks.filter(t => t.completed).length, [allTasks])
  const completionRate = allTasks.length > 0 ? Math.round((totalCompleted / allTasks.length) * 100) : 0
  const perfectDays = useMemo(() =>
    Object.values(dailyMap).filter(d => d.total >= 5 && d.completed === d.total).length,
  [dailyMap])

  // ── Category totals (all-time) ──────────────────────────────────────────────
  const categoryTotals = useMemo(() => {
    const t: Record<string, number> = { physical: 0, mental: 0, confidence: 0, spiritual: 0, lifestyle: 0 }
    for (const task of allTasks) if (task.completed && t[task.category] !== undefined) t[task.category]++
    return t
  }, [allTasks])

  const barData = CATEGORIES.map(c => ({ name: CAT_LABELS[c], count: categoryTotals[c], fill: CAT_COLORS[c] }))
  const pieData = CATEGORIES.filter(c => categoryTotals[c] > 0).map(c => ({ name: CAT_LABELS[c], value: categoryTotals[c], fill: CAT_COLORS[c] }))

  // ── 30-day line chart ───────────────────────────────────────────────────────
  const lineData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
      const day = dailyMap[date]
      const entry: any = { date: format(subDays(new Date(), 29 - i), 'MMM d') }
      for (const c of CATEGORIES) {
        entry[c] = day ? (day.byCategory[c] ? 100 : 0) : null
      }
      return entry
    })
  }, [dailyMap])

  // ── Overall daily activity (for streak chart) ───────────────────────────────
  const activityData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
      const day = dailyMap[date]
      return {
        date: format(subDays(new Date(), 29 - i), 'MMM d'),
        tasks: day?.completed ?? null,
      }
    })
  }, [dailyMap])

  // ── Calendar ────────────────────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start, end })
    const startDow = getDay(start)
    const blanks = Array(startDow).fill(null)
    return [
      ...blanks,
      ...days.map(d => {
        const dateStr = format(d, 'yyyy-MM-dd')
        const day = dailyMap[dateStr]
        return { dateStr, d: d.getDate(), completed: day?.completed || 0, total: day?.total || 0, tasks: day?.tasks || [] }
      }),
    ]
  }, [currentMonth, dailyMap])

  // Note: todayStr is declared above in body metrics state section

  // ── Tier data ───────────────────────────────────────────────────────────────
  const tiers = CATEGORIES.map(c => ({
    category: c,
    tier: skillRow?.[`${c}_tier`] || 1,
  }))

  const statCards = [
    { label: 'Tasks Completed', value: totalCompleted, icon: CheckCircle2, color: 'var(--green)' },
    { label: 'Current Streak', value: streak?.current_streak || 0, icon: Flame, color: '#f97316', suffix: ' days' },
    { label: 'Perfect Days', value: perfectDays, icon: Star, color: 'var(--gold)' },
    { label: 'Completion Rate', value: `${completionRate}%`, icon: TrendingUp, color: '#3b82f6' },
  ]

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>

      {/* Nav */}
      <nav className="px-5 py-4 flex items-center justify-between max-w-xl mx-auto" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span>⚒</span>
          <span className="text-xs font-black tracking-[0.15em] uppercase" style={{ color: 'var(--text)' }}>The Anvil</span>
        </Link>
      </nav>

      <main className="max-w-xl mx-auto px-5 py-8 space-y-6">

        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>Your Progress</p>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Analytics</h1>
          </div>
          {/* Tab switcher */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)' }}>
            {([['performance', 'Stats'], ['weekly', 'Week'], ['body', 'Body']] as const).map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{
                  background: activeTab === tab ? 'var(--green)' : 'transparent',
                  color: activeTab === tab ? '#000' : 'var(--text-3)',
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body Metrics Tab ── */}
        {activeTab === 'body' && (
          <div className="space-y-5">
            {/* Log today */}
            <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>Log Today</h2>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Weight (kg)', value: weight, set: setWeight, type: 'number', placeholder: '75.0' },
                  { label: 'Sleep (hrs)', value: sleep,  set: setSleep,  type: 'number', placeholder: '8.0' },
                  { label: 'Water (glasses)', value: water, set: setWater, type: 'number', placeholder: '8' },
                ].map(({ label, value, set, type, placeholder }) => (
                  <div key={label}>
                    <label className="block text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>{label}</label>
                    <input type={type} value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>Mood</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setMood(n === mood ? 0 : n)}
                        className="flex-1 py-2.5 rounded-xl text-sm transition-colors"
                        style={{ background: mood >= n ? 'var(--green)' : 'var(--surface-2)', color: mood >= n ? '#000' : 'var(--text-3)', border: '1px solid var(--border-2)' }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={saveMetrics} disabled={savingMetrics}
                className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-40 transition-opacity"
                style={{ background: metricsSaved ? 'rgba(34,197,94,0.15)' : 'var(--green)', color: metricsSaved ? 'var(--green)' : '#000' }}>
                {savingMetrics ? 'Saving…' : metricsSaved ? '✓ Saved' : 'Save Today\'s Metrics'}
              </button>
            </div>

            {/* History charts */}
            {mounted && metrics.length > 0 && (
              <>
                {[
                  { key: 'weight_kg', label: 'Weight (kg)', color: '#60a5fa', unit: 'kg' },
                  { key: 'sleep_hours', label: 'Sleep (hrs)', color: '#a78bfa', unit: 'h' },
                  { key: 'water_glasses', label: 'Water (glasses)', color: '#34d399', unit: 'gl' },
                  { key: 'mood', label: 'Mood (1–5)', color: '#fbbf24', unit: '' },
                ].map(({ key, label, color, unit }) => {
                  const chartData = metrics
                    .filter(m => m[key as keyof BodyMetric] != null)
                    .map(m => ({ date: format(new Date(m.date), 'MMM d'), value: m[key as keyof BodyMetric] }))
                  if (chartData.length === 0) return null
                  return (
                    <div key={key} className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>{label}</h2>
                      <ResponsiveContainer width="100%" height={120}>
                        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="date" tick={{ fill: 'var(--text-3)', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fill: 'var(--text-3)', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}${unit}`} />
                          <Tooltip content={({ active, payload, label: l }: any) => active && payload?.length ? (
                            <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}>
                              <p style={{ color: 'var(--text-2)' }}>{l}</p>
                              <p style={{ color }}>{payload[0].value}{unit}</p>
                            </div>
                          ) : null} />
                          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2}
                            dot={({ cx, cy, payload: p }: any) => p.value != null
                              ? <circle key={`${key}-${cx}`} cx={cx} cy={cy} r={3} fill={color} stroke="var(--bg)" strokeWidth={2} />
                              : <g key={`${key}-${cx}`} />
                            }
                            activeDot={{ r: 4, fill: color }} connectNulls={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )
                })}
              </>
            )}

            {metrics.length === 0 && (
              <div className="text-center py-10">
                <p className="text-sm" style={{ color: 'var(--text-2)' }}>No metrics logged yet.</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Log today's data above to start tracking.</p>
              </div>
            )}

            {/* Progress Photos */}
            <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>Progress Photos</h2>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>Label (optional)</label>
                  <input value={photoLabel} onChange={e => setPhotoLabel(e.target.value)} placeholder={`Front — ${format(new Date(), 'MMM d')}`}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }} />
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f) }} />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}
                  className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }}>
                  <Camera size={15} />
                  {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                </button>
              </div>

              {photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map(photo => (
                    <button key={photo.id} onClick={() => setLightboxPhoto(photo)}
                      className="aspect-square rounded-xl overflow-hidden relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 size={16} className="text-white" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 text-[9px] font-medium truncate"
                        style={{ background: 'rgba(0,0,0,0.65)', color: '#fff' }}>
                        {photo.label}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs py-4" style={{ color: 'var(--text-3)' }}>No photos yet. Upload your first progress photo.</p>
              )}
            </div>

            {/* Lightbox */}
            {lightboxPhoto && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.92)' }}
                onClick={() => setLightboxPhoto(null)}>
                <button className="absolute top-5 right-5 p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                  <X size={18} />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lightboxPhoto.url} alt={lightboxPhoto.label}
                  className="max-w-full max-h-full rounded-2xl object-contain"
                  onClick={e => e.stopPropagation()} />
                <div className="absolute bottom-6 text-center">
                  <p className="text-sm font-semibold text-white">{lightboxPhoto.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{lightboxPhoto.date}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Weekly Report Tab ── */}
        {activeTab === 'weekly' && mounted && (() => {
          const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
          const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
          const lastWeekStart = startOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 })
          const lastWeekEnd = endOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 })

          const thisWeekDays = eachDay({ start: weekStart, end: weekEnd }).map(d => format(d, 'yyyy-MM-dd'))
          const lastWeekDays = eachDay({ start: lastWeekStart, end: lastWeekEnd }).map(d => format(d, 'yyyy-MM-dd'))

          const weekTasks = recentTasks.filter(t => thisWeekDays.includes(t.date))
          const lastWeekTasks = recentTasks.filter(t => lastWeekDays.includes(t.date))

          const weekCompleted = weekTasks.filter(t => t.completed).length
          const weekTotal = weekTasks.length
          const weekPct = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0

          const lastWeekCompleted = lastWeekTasks.filter(t => t.completed).length
          const lastWeekTotal = lastWeekTasks.length
          const lastWeekPct = lastWeekTotal > 0 ? Math.round((lastWeekCompleted / lastWeekTotal) * 100) : 0

          const delta = weekPct - lastWeekPct
          const deltaColor = delta > 0 ? 'var(--green)' : delta < 0 ? '#ef4444' : 'var(--text-3)'
          const deltaLabel = delta > 0 ? `+${delta}%` : `${delta}%`

          const weekPerfectDays = thisWeekDays.filter(d => {
            const day = dailyMap[d]
            return day && day.total >= 5 && day.completed === day.total
          }).length

          // Category breakdown for this week
          const weekCatCompleted: Record<string, number> = {}
          const weekCatTotal: Record<string, number> = {}
          for (const t of weekTasks) {
            weekCatCompleted[t.category] = (weekCatCompleted[t.category] || 0) + (t.completed ? 1 : 0)
            weekCatTotal[t.category] = (weekCatTotal[t.category] || 0) + 1
          }

          // Best / worst day
          let bestDay = { date: '', completed: -1 }
          let worstDay = { date: '', completed: Infinity }
          for (const d of thisWeekDays) {
            const day = dailyMap[d]
            if (!day) continue
            if (day.completed > bestDay.completed) bestDay = { date: d, completed: day.completed }
            if (day.completed < worstDay.completed) worstDay = { date: d, completed: day.completed }
          }

          // Per-day bar data for this week
          const weekBarData = thisWeekDays.map(d => {
            const day = dailyMap[d]
            return {
              date: format(new Date(d + 'T12:00:00'), 'EEE'),
              completed: day?.completed ?? 0,
              total: day?.total ?? 0,
              isToday: d === todayStr,
            }
          })

          return (
            <div className="space-y-4">
              {/* Header */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>
                  Week of {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d')}
                </p>
                <div className="flex items-end gap-3 mt-3">
                  <div>
                    <p className="text-4xl font-black" style={{ color: 'var(--text)' }}>{weekPct}<span className="text-xl font-semibold">%</span></p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{weekCompleted}/{weekTotal} tasks completed</p>
                  </div>
                  {lastWeekTotal > 0 && (
                    <p className="text-sm font-bold mb-1" style={{ color: deltaColor }}>
                      {deltaLabel} vs last week
                    </p>
                  )}
                </div>
              </div>

              {/* Stat row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Perfect Days', value: weekPerfectDays, color: '#c9a227' },
                  { label: 'Last Week', value: `${lastWeekPct}%`, color: 'var(--text-2)' },
                  { label: 'Streak', value: `${streak?.current_streak || 0}d`, color: 'var(--green)' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-2xl p-4 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <p className="text-lg font-bold" style={{ color }}>{value}</p>
                    <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: 'var(--text-3)' }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Per-day bars */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <h3 className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>Day-by-Day</h3>
                <div className="flex items-end gap-2 h-28">
                  {weekBarData.map(d => {
                    const pct = d.total > 0 ? (d.completed / d.total) * 100 : 0
                    const perfect = d.total >= 5 && d.completed === d.total
                    const barColor = perfect ? '#c9a227' : d.completed >= 4 ? 'var(--green)' : d.completed >= 2 ? '#f59e0b' : d.total === 0 ? 'var(--border-2)' : '#ef4444'
                    const heightPct = d.total === 0 ? 8 : Math.max(8, pct)
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                        <div className="w-full rounded-t-lg transition-all" style={{ height: `${heightPct}%`, background: barColor, opacity: d.total === 0 ? 0.3 : 1 }} />
                        <span className="text-[10px] font-semibold" style={{ color: d.isToday ? 'var(--green)' : 'var(--text-3)' }}>{d.date}</span>
                        {d.total > 0 && <span className="text-[9px]" style={{ color: 'var(--text-3)' }}>{d.completed}/{d.total}</span>}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Category breakdown */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <h3 className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>This Week by Category</h3>
                <div className="space-y-3">
                  {CATEGORIES.map(cat => {
                    const done = weekCatCompleted[cat] || 0
                    const total = weekCatTotal[cat] || 0
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: CAT_COLORS[cat] }} />
                            <span className="text-xs font-medium capitalize" style={{ color: 'var(--text)' }}>{cat}</span>
                          </div>
                          <span className="text-xs font-bold" style={{ color: pct === 100 ? 'var(--green)' : pct >= 60 ? '#f59e0b' : 'var(--text-3)' }}>
                            {done}/{total} · {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-2)' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: CAT_COLORS[cat] }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Best / worst day */}
              {bestDay.date && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl p-4" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>Best Day</p>
                    <p className="text-base font-bold" style={{ color: 'var(--green)' }}>{format(new Date(bestDay.date + 'T12:00:00'), 'EEE d')}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{bestDay.completed} tasks</p>
                  </div>
                  {worstDay.date && worstDay.date !== bestDay.date && (
                    <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                      <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>Needs Work</p>
                      <p className="text-base font-bold" style={{ color: '#ef4444' }}>{format(new Date(worstDay.date + 'T12:00:00'), 'EEE d')}</p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{worstDay.completed} tasks</p>
                    </div>
                  )}
                </div>
              )}

              {/* Motivational message */}
              <div className="rounded-2xl p-5 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-2xl mb-2">
                  {weekPct === 100 ? '🔥' : weekPct >= 80 ? '💪' : weekPct >= 60 ? '📈' : weekPct >= 40 ? '⚡' : '🗡️'}
                </p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  {weekPct === 100 ? 'Flawless week. Legendary.' :
                   weekPct >= 80 ? 'Dominant week. Keep the standard.' :
                   weekPct >= 60 ? 'Solid week. Push harder.' :
                   weekPct >= 40 ? 'Inconsistent. The Anvil demands more.' :
                   'Below standard. Fix it this week.'}
                </p>
                {delta > 0 && lastWeekTotal > 0 && (
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-3)' }}>Up {delta}% from last week. Good.</p>
                )}
              </div>
            </div>
          )
        })()}

        {activeTab === 'performance' && (<>

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map(({ label, value, icon: Icon, color, suffix }) => (
            <div key={label} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <Icon size={16} style={{ color }} className="mb-3" />
              <div className="text-2xl font-black" style={{ color: 'var(--text)' }}>
                {value}{suffix}
              </div>
              <div className="text-xs mt-1 uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Category Breakdown bar chart ── */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--text-3)' }}>Category Breakdown</h2>
          {mounted ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" tick={{ fill: 'var(--text-3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-2)', fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
                <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.fill} opacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-44" />}
        </div>

        {/* ── 30-day overall completion ── */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>Daily Completion</h2>
          <p className="text-xs mb-5" style={{ color: 'var(--text-3)' }}>% of tasks completed each day — last 30 days</p>
          {mounted ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={activityData} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-3)', fontSize: 9 }} axisLine={false} tickLine={false} interval={6} />
                <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fill: 'var(--text-3)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }: any) => active && payload?.length && payload[0].value !== null ? (
                    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}>
                      <p style={{ color: 'var(--text-2)' }}>{label}</p>
                      <p style={{ color: 'var(--green)' }}>{payload[0].value} / 5 tasks</p>
                    </div>
                  ) : null}
                />
                <Line
                  type="monotone"
                  dataKey="tasks"
                  stroke="var(--green)"
                  strokeWidth={2}
                  dot={({ cx, cy, payload }: any) =>
                    payload.tasks !== null
                      ? <circle key={`dot-${cx}`} cx={cx} cy={cy} r={4} fill="var(--green)" stroke="var(--bg)" strokeWidth={2} />
                      : <g key={`dot-${cx}`} />
                  }
                  activeDot={{ r: 5, fill: 'var(--green)', stroke: 'var(--bg)', strokeWidth: 2 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="h-48" />}
        </div>

        {/* ── Category lines (last 30 days) ── */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>Category Performance</h2>
          <p className="text-xs mb-5" style={{ color: 'var(--text-3)' }}>Completed (100%) or missed (0%) per category — last 30 days</p>
          {mounted ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={lineData} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-3)', fontSize: 9 }} axisLine={false} tickLine={false} interval={6} />
                  <YAxis domain={[0, 100]} ticks={[0, 100]} tick={{ fill: 'var(--text-3)', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => v === 100 ? '✓' : '✗'} />
                  <Tooltip content={<CustomTooltip />} />
                  {CATEGORIES.map(c => (
                    <Line
                      key={c}
                      type="step"
                      dataKey={c}
                      stroke={CAT_COLORS[c]}
                      strokeWidth={1.5}
                      dot={({ cx, cy, payload }: any) =>
                        payload[c] !== null
                          ? <circle key={`${c}-${cx}`} cx={cx} cy={cy} r={3} fill={CAT_COLORS[c]} stroke="var(--bg)" strokeWidth={1.5} />
                          : <g key={`${c}-${cx}`} />
                      }
                      activeDot={{ r: 4 }}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4">
                {CATEGORIES.map(c => (
                  <div key={c} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[c] }} />
                    <span className="text-xs" style={{ color: 'var(--text-2)' }}>{CAT_LABELS[c]}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="h-56" />}
        </div>

        {/* ── Pie chart ── */}
        {pieData.length > 0 && (
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h2 className="text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--text-3)' }}>Category Distribution</h2>
            {mounted ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                      dataKey="value" paddingAngle={3}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} opacity={0.85} />)}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
                  {pieData.map(d => {
                    const pct = Math.round((d.value / totalCompleted) * 100)
                    return (
                      <div key={d.name} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                        <span className="text-xs" style={{ color: 'var(--text-2)' }}>{d.name} {pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : <div className="h-52" />}
          </div>
        )}

        {/* ── Calendar heatmap ── */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}
                className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-2)' }}>
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}
                className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-2)' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Day of week headers */}
          <div className="grid grid-cols-7 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-center text-xs py-1" style={{ color: 'var(--text-3)' }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`blank-${i}`} />
              const isToday = day.dateStr === todayStr
              const hasTasks = day.total > 0
              return (
                <button
                  key={day.dateStr}
                  onClick={() => hasTasks && setSelectedDay({ date: day.dateStr, tasks: day.tasks })}
                  className="aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-opacity"
                  style={{
                    background: heatColor(day.completed, day.total),
                    border: `1px solid ${isToday ? 'var(--green)' : heatBorder(day.completed, day.total)}`,
                    color: hasTasks ? 'var(--text)' : 'var(--text-3)',
                    cursor: hasTasks ? 'pointer' : 'default',
                    outline: isToday ? '1px solid var(--green)' : 'none',
                    outlineOffset: '1px',
                  }}
                >
                  {day.d}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            {[
              { color: 'rgba(239,68,68,0.25)', label: '0 tasks' },
              { color: 'rgba(251,191,36,0.3)', label: '1–2' },
              { color: 'rgba(34,197,94,0.3)', label: '3–4' },
              { color: 'rgba(139,92,246,0.4)', label: 'Perfect' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ background: color }} />
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Day detail */}
          {selectedDay && (
            <div className="mt-4 rounded-xl p-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>
                  {format(new Date(selectedDay.date + 'T12:00:00'), 'MMMM d, yyyy')}
                </p>
                <button onClick={() => setSelectedDay(null)} className="text-xs" style={{ color: 'var(--text-3)' }}>✕</button>
              </div>
              <div className="space-y-2">
                {selectedDay.tasks.map((t, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[t.category] || 'var(--text-3)' }} />
                    <span className="text-xs flex-1" style={{ color: t.completed ? 'var(--text)' : 'var(--text-3)', textDecoration: t.completed ? 'none' : 'line-through' }}>
                      {t.base_task || t.category}
                    </span>
                    <span className="text-xs" style={{ color: t.completed ? 'var(--green)' : 'var(--text-3)' }}>
                      {t.completed ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Category Tiers ── */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--text-3)' }}>Category Tiers</h2>
          <div className="space-y-3">
            {tiers.map(({ category, tier }) => {
              const tierColor = TIER_COLORS[tier] || TIER_COLORS[1]
              const tierLabel = TIER_LABELS[tier] || 'Iron'
              const catColor = CAT_COLORS[category]
              const pct = (tier / 4) * 100
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: catColor }} />
                      <span className="text-sm font-medium capitalize" style={{ color: 'var(--text)' }}>{category}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: tierColor }}>{tierLabel}</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-2)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tierColor }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            {['Iron', 'Steel', 'Bronze', 'Gold'].map((t, i) => (
              <span key={t} className="text-xs" style={{ color: TIER_COLORS[i + 1] }}>{t}</span>
            ))}
          </div>
        </div>

        </>)} {/* end performance tab */}

      </main>

      <BottomNav />
    </div>
  )
}
