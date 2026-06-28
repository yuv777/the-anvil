'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import BottomNav from '@/app/components/BottomNav'
import {
  User, Lock, Sliders, Bell, Palette, Shield, Info,
  ChevronRight, X, Eye, EyeOff, Check, AlertTriangle, Download, Plus, Trash2, BookOpen, Moon,
} from 'lucide-react'
import { useTheme, THEMES, type ThemeId } from '@/app/hooks/useTheme'

// ─── Constants ────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  physical:   'var(--cat-physical)',
  mental:     'var(--cat-mental)',
  confidence: 'var(--cat-confidence)',
  spiritual:  'var(--cat-spiritual)',
  lifestyle:  'var(--cat-lifestyle)',
}

const TIER_LABELS = ['', 'Iron', 'Steel', 'Bronze', 'Gold']
const TIER_COLORS = ['', '#9ca3af', '#94a3b8', '#c97316', '#c9a227']

const SKILL_QUESTIONS: Record<string, { question: string; options: { label: string; tier: number }[] }> = {
  physical: {
    question: 'How many push-ups can you do?',
    options: [
      { label: '0 – 10',  tier: 1 },
      { label: '11 – 30', tier: 2 },
      { label: '31 – 50', tier: 3 },
      { label: '50+',     tier: 4 },
    ],
  },
  mental: {
    question: 'How many books did you read last year?',
    options: [
      { label: '0',     tier: 1 },
      { label: '1 – 3', tier: 2 },
      { label: '4 – 10',tier: 3 },
      { label: '10+',   tier: 4 },
    ],
  },
  confidence: {
    question: 'How comfortable are you speaking in public?',
    options: [
      { label: 'Very uncomfortable',     tier: 1 },
      { label: 'Somewhat uncomfortable', tier: 2 },
      { label: 'Comfortable',            tier: 3 },
      { label: 'Very comfortable',       tier: 4 },
    ],
  },
  spiritual: {
    question: 'How often do you meditate?',
    options: [
      { label: 'Never',  tier: 1 },
      { label: 'Rarely', tier: 2 },
      { label: 'Weekly', tier: 3 },
      { label: 'Daily',  tier: 4 },
    ],
  },
  lifestyle: {
    question: 'How organized is your daily routine?',
    options: [
      { label: 'Chaotic',          tier: 1 },
      { label: 'Somewhat organized',tier: 2 },
      { label: 'Organized',        tier: 3 },
      { label: 'Highly organized', tier: 4 },
    ],
  },
}

// ─── Types ────────────────────────────────────────────────────

interface SkillLevel { category: string; current_tier: number }

interface Props {
  userId: string
  username: string
  displayName: string
  email: string
  skillLevels: SkillLevel[]
}

// ─── Sub-components ───────────────────────────────────────────

function Toast({ message, type, onDismiss }: { message: string; type: 'success' | 'error'; onDismiss: () => void }) {
  return (
    <div
      className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-xl fade-in-up"
      style={{
        background: type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
        border: `1px solid ${type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        color: type === 'success' ? 'var(--green)' : '#f87171',
        maxWidth: '90vw',
        whiteSpace: 'nowrap',
      }}
    >
      {type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-1 opacity-60 hover:opacity-100"><X size={12} /></button>
    </div>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 space-y-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5">
        <Icon size={12} style={{ color: 'var(--text-3)' }} />
        <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>{title}</span>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {children}
      </div>
    </div>
  )
}

function SettingRow({
  label, value, onClick, danger, last, children,
}: {
  label: string; value?: string; onClick?: () => void; danger?: boolean; last?: boolean; children?: React.ReactNode
}) {
  const borderStyle = last ? 'none' : '1px solid var(--border)'
  if (children) {
    return (
      <div className="px-4 py-3.5 flex items-center justify-between" style={{ borderBottom: borderStyle }}>
        <span className="text-sm" style={{ color: 'var(--text)' }}>{label}</span>
        {children}
      </div>
    )
  }
  return (
    <button
      className="w-full flex items-center justify-between px-4 py-3.5 text-left"
      style={{ borderBottom: borderStyle }}
      onClick={onClick}
    >
      <span className="text-sm" style={{ color: danger ? '#f87171' : 'var(--text)' }}>{label}</span>
      <div className="flex items-center gap-2">
        {value && <span className="text-xs" style={{ color: 'var(--text-3)' }}>{value}</span>}
        {onClick && <ChevronRight size={13} style={{ color: 'var(--text-3)' }} />}
      </div>
    </button>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative flex-shrink-0 rounded-full transition-colors"
      style={{ width: 40, height: 24, background: on ? 'var(--green)' : 'var(--border-2)' }}
    >
      <span
        className="absolute top-0.5 rounded-full transition-all"
        style={{
          width: 20, height: 20,
          background: on ? '#000' : 'var(--text-3)',
          left: on ? 18 : 2,
        }}
      />
    </button>
  )
}

function PasswordInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'Password'}
        className="w-full px-4 py-3.5 pr-10 rounded-xl text-sm focus:outline-none"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80"
      >
        {show ? <EyeOff size={14} style={{ color: 'var(--text-2)' }} /> : <Eye size={14} style={{ color: 'var(--text-2)' }} />}
      </button>
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text', autoFocus }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; autoFocus?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }}
    />
  )
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{title}</h3>
      <button onClick={onClose}><X size={17} style={{ color: 'var(--text-3)' }} /></button>
    </div>
  )
}

function SaveButton({ onClick, loading, label, disabled }: { onClick: () => void; loading: boolean; label: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide disabled:opacity-40 transition-opacity"
      style={{ background: 'var(--green)', color: '#000' }}
    >
      {loading ? 'Saving…' : label}
    </button>
  )
}

// ─── Helpers ──────────────────────────────────────────────────

function maskEmail(e: string) {
  const [user, domain] = e.split('@')
  return (user?.[0] || '') + '***@' + (domain || '')
}

function pwStrength(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', '#f87171', '#fbbf24', '#34d399', '#22c55e']
  return { score, label: labels[score] || '', color: colors[score] || 'transparent' }
}

// ─── Main Component ───────────────────────────────────────────

export default function SettingsClient({
  userId, username: initUsername, displayName: initDisplayName, email, skillLevels: initSkills,
}: Props) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { theme, changeTheme } = useTheme()

  // ── Custom habits ──
  interface CustomHabit { id: string; category: string; activity_name: string; value_description: string | null }
  const [customHabits, setCustomHabits]   = useState<CustomHabit[]>([])
  const [newHabitCat, setNewHabitCat]     = useState('physical')
  const [newHabitName, setNewHabitName]   = useState('')
  const [newHabitDesc, setNewHabitDesc]   = useState('')

  useEffect(() => {
    supabase.from('user_custom_activities').select('*').eq('user_id', userId)
      .then(({ data }) => { if (data) setCustomHabits(data as CustomHabit[]) })
  }, [userId, supabase])

  async function addCustomHabit() {
    if (!newHabitName.trim()) return
    setLoading(true)
    const { data, error } = await supabase.from('user_custom_activities')
      .insert({ user_id: userId, category: newHabitCat, activity_name: newHabitName.trim(), value_description: newHabitDesc.trim() || null })
      .select().single()
    setLoading(false)
    if (error) { showToast(error.message, 'error'); return }
    if (data) setCustomHabits(prev => [...prev, data as CustomHabit])
    setNewHabitName(''); setNewHabitDesc('')
    closeModal()
    showToast('Custom habit added')
  }

  async function deleteCustomHabit(id: string) {
    const { error } = await supabase.from('user_custom_activities').delete().eq('id', id)
    if (!error) setCustomHabits(prev => prev.filter(h => h.id !== id))
    else showToast(error.message, 'error')
  }

  // ── Sleep alarms ──
  const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
  const DAY_LABELS: Record<string, string> = { mon: 'M', tue: 'T', wed: 'W', thu: 'T', fri: 'F', sat: 'S', sun: 'S' }

  interface SleepAlarm { id: string; label: string; alarm_time: string; days: string[]; enabled: boolean }
  const [alarms, setAlarms]           = useState<SleepAlarm[]>([])
  const [newAlarmLabel, setNewAlarmLabel] = useState('Bedtime')
  const [newAlarmTime, setNewAlarmTime]   = useState('22:30')
  const [newAlarmDays, setNewAlarmDays]   = useState<string[]>(['mon','tue','wed','thu','fri','sat','sun'])
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission)
    }
    supabase.from('user_sleep_alarms').select('*').eq('user_id', userId).order('alarm_time')
      .then(({ data }) => { if (data) setAlarms(data as SleepAlarm[]) })
  }, [userId, supabase])

  async function requestNotifPermission() {
    if (!('Notification' in window)) { showToast('Notifications not supported in this browser', 'error'); return }
    const result = await Notification.requestPermission()
    setNotifPermission(result)
    if (result === 'granted') showToast('Notifications enabled')
    else showToast('Permission denied — enable notifications in browser settings', 'error')
  }

  function toggleAlarmDay(day: string) {
    setNewAlarmDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  async function addAlarm() {
    if (!newAlarmTime || newAlarmDays.length === 0) { showToast('Pick a time and at least 1 day', 'error'); return }
    setLoading(true)
    const { data, error } = await supabase.from('user_sleep_alarms')
      .insert({ user_id: userId, label: newAlarmLabel.trim() || 'Alarm', alarm_time: newAlarmTime, days: newAlarmDays, enabled: true })
      .select().single()
    setLoading(false)
    if (error) { showToast(error.message, 'error'); return }
    if (data) setAlarms(prev => [...prev, data as SleepAlarm].sort((a, b) => a.alarm_time.localeCompare(b.alarm_time)))
    closeModal()
    showToast('Alarm set')
  }

  async function toggleAlarm(id: string, enabled: boolean) {
    const { error } = await supabase.from('user_sleep_alarms').update({ enabled }).eq('id', id)
    if (!error) setAlarms(prev => prev.map(a => a.id === id ? { ...a, enabled } : a))
  }

  async function deleteAlarm(id: string) {
    const { error } = await supabase.from('user_sleep_alarms').delete().eq('id', id)
    if (!error) setAlarms(prev => prev.filter(a => a.id !== id))
    else showToast(error.message, 'error')
  }

  function fmt12h(time: string) {
    const [h, m] = time.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
  }

  // ── reactive state ──
  const [username, setUsername]       = useState(initUsername)
  const [displayName, setDisplayName] = useState(initDisplayName)
  const [skillLevels, setSkillLevels] = useState(initSkills)

  // ── toast ──
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── modal ──
  const [modal, setModal]             = useState<string | null>(null)
  const [resetCategory, setResetCat] = useState<string | null>(null)
  const [selectedTier, setSelTier]   = useState<number | null>(null)

  // ── form fields ──
  const [newDisplayName, setNewDisplayName] = useState('')
  const [newUsername, setNewUsername]       = useState('')
  const [newEmail, setNewEmail]             = useState('')
  const [newPw, setNewPw]                   = useState('')
  const [confirmPw, setConfirmPw]           = useState('')
  const [deleteText, setDeleteText]         = useState('')
  const [deletePw, setDeletePw]             = useState('')
  const [loading, setLoading]               = useState(false)

  // ── notification prefs (UI state only) ──
  const [notifReminder, setNotifReminder]   = useState(true)
  const [reminderTime, setReminderTime]     = useState('18:00')
  const [notifSquad, setNotifSquad]         = useState(true)
  const [notifStreak, setNotifStreak]       = useState(true)
  const [notifEmail, setNotifEmail]         = useState(false)
  const [compactView, setCompactView]       = useState(false)

  function openModal(name: string) {
    setModal(name)
    setNewDisplayName(displayName)
    setNewUsername(username)
    setNewEmail('')
    setNewPw(''); setConfirmPw('')
    setDeleteText(''); setDeletePw('')
    setLoading(false)
  }

  function closeModal() {
    setModal(null)
    setResetCat(null)
    setSelTier(null)
  }

  // ── handlers ──

  async function saveDisplayName() {
    if (!newDisplayName.trim()) return
    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: newDisplayName.trim() })
      .eq('id', userId)
    setLoading(false)
    if (error) {
      // Column may not exist yet — guide user
      if (error.message.includes('display_name')) {
        showToast('Run: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name text;', 'error')
      } else {
        showToast(error.message, 'error')
      }
      return
    }
    setDisplayName(newDisplayName.trim())
    closeModal()
    showToast('Display name updated')
  }

  async function saveUsername() {
    const trimmed = newUsername.trim().toLowerCase()
    if (!trimmed || trimmed === username) { closeModal(); return }
    setLoading(true)
    const { data: existing } = await supabase
      .from('profiles').select('id').eq('username', trimmed).neq('id', userId).maybeSingle()
    if (existing) { setLoading(false); showToast('Username already taken', 'error'); return }
    const { error } = await supabase.from('profiles').update({ username: trimmed }).eq('id', userId)
    setLoading(false)
    if (error) { showToast(error.message, 'error'); return }
    setUsername(trimmed)
    closeModal()
    showToast('Username updated')
  }

  async function saveEmail() {
    if (!newEmail.trim()) return
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    setLoading(false)
    if (error) { showToast(error.message, 'error'); return }
    closeModal()
    showToast('Verification email sent — check your inbox')
  }

  async function savePassword() {
    if (newPw !== confirmPw) { showToast('Passwords do not match', 'error'); return }
    if (newPw.length < 6) { showToast('Minimum 6 characters', 'error'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setLoading(false)
    if (error) { showToast(error.message, 'error'); return }
    closeModal()
    showToast('Password updated')
  }

  async function saveSkillReset() {
    if (!resetCategory || selectedTier === null) return
    setLoading(true)
    const col = `${resetCategory}_tier` as string
    const tier = selectedTier  // capture before any state changes
    const cat  = resetCategory

    const { data, error } = await supabase
      .from('user_skill_levels')
      .update({ [col]: tier })
      .eq('user_id', userId)
      .select('user_id')

    setLoading(false)

    if (error) {
      console.error('skill reset error:', error)
      showToast(error.message, 'error')
      return
    }

    if (!data || data.length === 0) {
      // No row existed yet — insert one
      const { error: insertError } = await supabase
        .from('user_skill_levels')
        .insert({ user_id: userId, [col]: tier })
      if (insertError) {
        console.error('skill insert error:', insertError)
        showToast(insertError.message, 'error')
        return
      }
    }

    setSkillLevels(prev => prev.map(s => s.category === cat ? { ...s, current_tier: tier } : s))
    closeModal()
    showToast(`${cat.charAt(0).toUpperCase() + cat.slice(1)} tier updated`)
  }

  async function exportData() {
    setLoading(true)
    const [tasksRes, streakRes, squadsRes, skillRes] = await Promise.all([
      supabase.from('user_daily_tasks').select('*').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('user_streaks').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('squad_members').select('squad_id, joined_at, squads(name)').eq('user_id', userId),
      supabase.from('user_skill_levels').select('*').eq('user_id', userId).maybeSingle(),
    ])
    setLoading(false)

    const lines: string[] = [
      '# The Anvil — Data Export',
      `# Generated: ${new Date().toISOString()}`,
      '',
      '## Tasks',
      'date,category,task,difficulty_tier,completed,completed_at',
      ...(tasksRes.data || []).map((t: any) =>
        [t.date, t.category, `"${(t.task_text || '').replace(/"/g, '""')}"`, t.difficulty_tier, t.completed ? 'yes' : 'no', t.completed_at || ''].join(',')
      ),
      '',
      '## Streaks',
      `current_streak,${streakRes.data?.current_streak || 0}`,
      `longest_streak,${streakRes.data?.longest_streak || 0}`,
      '',
      '## Skill Levels',
      'category,tier_number,tier_name',
      ...skillLevels.map(s => `${s.category},${s.current_tier},${TIER_LABELS[s.current_tier] || 'Iron'}`),
      '',
      '## Squads',
      'squad_name,joined_at',
      ...((squadsRes.data || []).map((m: any) => `"${(m as any).squads?.name || m.squad_id}",${m.joined_at?.split('T')[0] || ''}`)),
    ]

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `the-anvil-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Export downloaded')
  }

  async function deleteAccount() {
    if (deleteText !== 'DELETE') { showToast('Type DELETE to confirm', 'error'); return }
    if (!deletePw) { showToast('Password required', 'error'); return }
    setLoading(true)

    // Re-authenticate
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password: deletePw })
    if (authErr) { setLoading(false); showToast('Incorrect password', 'error'); return }

    // Delete all user data
    await Promise.all([
      supabase.from('user_daily_tasks').delete().eq('user_id', userId),
      supabase.from('user_streaks').delete().eq('user_id', userId),
      supabase.from('user_skill_levels').delete().eq('user_id', userId),
      supabase.from('squad_members').delete().eq('user_id', userId),
    ])
    await supabase.from('profiles').delete().eq('id', userId)

    // Attempt to delete auth record via RPC (requires delete_own_account() function in Supabase)
    try { await supabase.rpc('delete_own_account') } catch { /* optional RPC */ }

    await supabase.auth.signOut()
    router.push('/login')
  }

  const strength = pwStrength(newPw)

  // ── render ──

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--bg)' }}>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      {/* Nav */}
      <nav className="px-5 py-4 flex items-center max-w-xl mx-auto" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span>⚒</span>
          <span className="text-xs font-black tracking-[0.15em] uppercase" style={{ color: 'var(--text)' }}>The Anvil</span>
        </Link>
      </nav>

      <main className="max-w-xl mx-auto px-5 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Settings</h1>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-2)' }}>Manage your account and preferences.</p>
        </div>

        {/* ── Section 1: Profile ── */}
        <Section title="Profile" icon={User}>
          <SettingRow label="Display Name" value={displayName} onClick={() => openModal('displayName')} />
          <SettingRow label="Username" value={`@${username}`} onClick={() => openModal('username')} />
          <SettingRow label="Email" value={maskEmail(email)} onClick={() => openModal('email')} last />
        </Section>

        {/* ── Section 2: Password & Security ── */}
        <Section title="Password & Security" icon={Lock}>
          <SettingRow label="Change Password" onClick={() => openModal('password')} />
          <SettingRow label="Two-Factor Authentication" last>
            <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'var(--border)', color: 'var(--text-3)' }}>
              Coming soon
            </span>
          </SettingRow>
        </Section>

        {/* ── Section 3: Skill Levels ── */}
        <Section title="Skill Levels" icon={Sliders}>
          {skillLevels.map((skill, i) => (
            <div
              key={skill.category}
              className="px-4 py-3.5 flex items-center justify-between"
              style={{ borderBottom: i < skillLevels.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[skill.category] }} />
                <span className="text-sm capitalize" style={{ color: 'var(--text)' }}>{skill.category}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold" style={{ color: TIER_COLORS[skill.current_tier] || TIER_COLORS[1] }}>
                  {TIER_LABELS[skill.current_tier] || 'Iron'}
                </span>
                <button
                  onClick={() => { setResetCat(skill.category); setSelTier(null); setModal('skillReset') }}
                  className="text-xs px-2.5 py-1 rounded-lg font-medium"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-2)' }}
                >
                  Reset
                </button>
              </div>
            </div>
          ))}
        </Section>

        {/* ── Section 4: Notifications ── */}
        <Section title="Notifications" icon={Bell}>
          {([
            { key: 'reminder', label: 'Daily Reminder',   sub: 'Remind me to complete my tasks', on: notifReminder, set: setNotifReminder },
            { key: 'squad',    label: 'Squad Activity',   sub: 'New members and milestones',      on: notifSquad,    set: setNotifSquad },
            { key: 'streak',   label: 'Streak Alerts',    sub: 'Risk of losing your streak',      on: notifStreak,   set: setNotifStreak },
            { key: 'email',    label: 'Email Digest',     sub: 'Weekly progress summary',         on: notifEmail,    set: setNotifEmail },
          ] as const).map(({ key, label, sub, on, set }, i, arr) => (
            <div
              key={key}
              className="px-4 py-3.5 flex items-center justify-between"
              style={{ borderBottom: i < arr.length - 1 || notifReminder ? '1px solid var(--border)' : 'none' }}
            >
              <div>
                <div className="text-sm" style={{ color: 'var(--text)' }}>{label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{sub}</div>
              </div>
              <Toggle on={on} onChange={set as (v: boolean) => void} />
            </div>
          ))}
          {notifReminder && (
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'var(--surface-2)' }}>
              <span className="text-xs" style={{ color: 'var(--text-2)' }}>Reminder time</span>
              <input
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                className="text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                style={{ background: 'var(--border)', color: 'var(--text)', border: 'none' }}
              />
            </div>
          )}
        </Section>

        {/* ── Section 4b: Sleep Alarms ── */}
        <Section title="Sleep Alarms" icon={Moon}>
          {/* Notification permission banner */}
          {notifPermission !== 'granted' && (
            <button
              onClick={requestNotifPermission}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
              style={{ borderBottom: '1px solid var(--border)', background: 'rgba(201,162,39,0.05)' }}
            >
              <Bell size={15} style={{ color: 'var(--gold)', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>Enable notifications</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Required for alarms to ring</p>
              </div>
              <ChevronRight size={13} style={{ color: 'var(--gold)' }} />
            </button>
          )}

          {/* Alarm list */}
          {alarms.length === 0 ? (
            <div className="px-4 py-5 text-sm" style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
              No alarms set yet.
            </div>
          ) : alarms.map((alarm, i) => (
            <div
              key={alarm.id}
              className="flex items-center gap-3 px-4 py-3.5"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              {/* Time + label */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black" style={{ color: alarm.enabled ? 'var(--text)' : 'var(--text-3)' }}>
                    {fmt12h(alarm.alarm_time)}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{alarm.label}</p>
                <div className="flex gap-1 mt-1.5">
                  {DAYS.map(d => (
                    <span
                      key={d}
                      className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                      style={{
                        background: alarm.days.includes(d) ? 'var(--green)' : 'var(--surface-2)',
                        color: alarm.days.includes(d) ? '#000' : 'var(--text-3)',
                      }}
                    >
                      {DAY_LABELS[d]}
                    </span>
                  ))}
                </div>
              </div>
              {/* Toggle + delete */}
              <div className="flex items-center gap-3 shrink-0">
                <Toggle on={alarm.enabled} onChange={v => toggleAlarm(alarm.id, v)} />
                <button onClick={() => deleteAlarm(alarm.id)}>
                  <Trash2 size={15} style={{ color: '#f87171' }} />
                </button>
              </div>
            </div>
          ))}

          {/* Add alarm */}
          <button
            onClick={() => { setNewAlarmLabel('Bedtime'); setNewAlarmTime('22:30'); setNewAlarmDays(['mon','tue','wed','thu','fri','sat','sun']); openModal('addAlarm') }}
            className="flex items-center gap-2 px-4 py-3.5 w-full text-left"
            style={{ color: 'var(--green)' }}
          >
            <Plus size={16} />
            <span className="text-sm font-medium">Add Alarm</span>
          </button>
        </Section>

        {/* ── Section 5: Appearance ── */}
        <Section title="Appearance" icon={Palette}>
          <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>Theme</p>
            <div className="grid grid-cols-5 gap-2">
              {THEMES.map(t => {
                const active = theme === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => changeTheme(t.id as ThemeId)}
                    className="flex flex-col items-center gap-2"
                  >
                    {/* Swatch */}
                    <div
                      className="w-full aspect-square rounded-2xl flex items-center justify-center transition-all"
                      style={{
                        background: t.bg,
                        border: `2px solid ${active ? t.accent : 'var(--border-2)'}`,
                        boxShadow: active ? `0 0 0 2px ${t.accent}30` : 'none',
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ background: t.accent }}
                      />
                    </div>
                    {/* Label */}
                    <span
                      className="text-[10px] font-medium leading-none"
                      style={{ color: active ? 'var(--text)' : 'var(--text-3)' }}
                    >
                      {t.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <SettingRow label="Compact View" last>
            <Toggle on={compactView} onChange={setCompactView} />
          </SettingRow>
        </Section>

        {/* ── Section 5b: Custom Habits ── */}
        <Section title="Custom Habits" icon={BookOpen}>
          {customHabits.length === 0 ? (
            <div className="px-4 py-5 text-sm" style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
              No custom habits yet. Add one below.
            </div>
          ) : (
            customHabits.map((h, i) => (
              <div
                key={h.id}
                className="flex items-center justify-between px-4 py-3.5"
                style={{ borderBottom: i < customHabits.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{h.activity_name}</span>
                  <span className="text-xs capitalize" style={{ color: 'var(--text-3)' }}>{h.category}</span>
                </div>
                <button onClick={() => deleteCustomHabit(h.id)} className="ml-4 shrink-0">
                  <Trash2 size={16} style={{ color: '#f87171' }} />
                </button>
              </div>
            ))
          )}
          <button
            onClick={() => { setNewHabitName(''); setNewHabitDesc(''); setNewHabitCat('physical'); openModal('addHabit') }}
            className="flex items-center gap-2 px-4 py-3.5 w-full text-left"
            style={{ color: 'var(--green)' }}
          >
            <Plus size={16} />
            <span className="text-sm font-medium">Add Custom Habit</span>
          </button>
        </Section>

        {/* ── Section 6: Data & Privacy ── */}
        <Section title="Data & Privacy" icon={Shield}>
          <button
            onClick={exportData}
            disabled={loading}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left disabled:opacity-40"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2.5">
              <Download size={13} style={{ color: 'var(--text-2)' }} />
              <span className="text-sm" style={{ color: 'var(--text)' }}>Export My Data</span>
            </div>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>CSV</span>
          </button>
          <SettingRow label="Delete Account" onClick={() => openModal('delete')} danger last />
        </Section>

        {/* ── Section 7: About ── */}
        <Section title="About & Support" icon={Info}>
          <SettingRow label="Version" value="v1.0.0" />
          <a
            href="mailto:support@theanvil.app"
            className="flex items-center justify-between px-4 py-3.5"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <span className="text-sm" style={{ color: 'var(--text)' }}>Support</span>
            <ChevronRight size={13} style={{ color: 'var(--text-3)' }} />
          </a>
          <a
            href="mailto:feedback@theanvil.app"
            className="flex items-center justify-between px-4 py-3.5"
          >
            <span className="text-sm" style={{ color: 'var(--text)' }}>Send Feedback</span>
            <ChevronRight size={13} style={{ color: 'var(--text-3)' }} />
          </a>
        </Section>

      </main>

      {/* ══════════════════════════════════════════ MODALS ══ */}

      {/* Display Name */}
      {modal === 'displayName' && (
        <Modal onClose={closeModal}>
          <ModalHeader title="Display Name" onClose={closeModal} />
          <TextInput value={newDisplayName} onChange={setNewDisplayName} placeholder="Your name" autoFocus />
          <SaveButton onClick={saveDisplayName} loading={loading} label="Save" disabled={!newDisplayName.trim()} />
        </Modal>
      )}

      {/* Username */}
      {modal === 'username' && (
        <Modal onClose={closeModal}>
          <ModalHeader title="Change Username" onClose={closeModal} />
          <div>
            <TextInput
              value={newUsername}
              onChange={v => setNewUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="username"
              autoFocus
            />
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-3)' }}>
              Lowercase letters, numbers, and underscores only.
            </p>
          </div>
          <SaveButton onClick={saveUsername} loading={loading} label="Save" disabled={!newUsername.trim()} />
        </Modal>
      )}

      {/* Email */}
      {modal === 'email' && (
        <Modal onClose={closeModal}>
          <ModalHeader title="Change Email" onClose={closeModal} />
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            A verification link will be sent to the new address. Your email won&apos;t change until you click it.
          </p>
          <TextInput type="email" value={newEmail} onChange={setNewEmail} placeholder="new@email.com" autoFocus />
          <SaveButton onClick={saveEmail} loading={loading} label="Send Verification Email" disabled={!newEmail.trim()} />
        </Modal>
      )}

      {/* Password */}
      {modal === 'password' && (
        <Modal onClose={closeModal}>
          <ModalHeader title="Change Password" onClose={closeModal} />
          <div className="space-y-3">
            <PasswordInput value={newPw} onChange={setNewPw} placeholder="New password" />
            {newPw.length > 0 && (
              <div>
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="flex-1 rounded-full transition-colors"
                      style={{ height: 2, background: i <= strength.score ? strength.color : 'var(--border-2)' }}
                    />
                  ))}
                </div>
                <p className="text-xs" style={{ color: strength.color }}>{strength.label}</p>
              </div>
            )}
            <PasswordInput value={confirmPw} onChange={setConfirmPw} placeholder="Confirm new password" />
          </div>
          <SaveButton onClick={savePassword} loading={loading} label="Update Password" disabled={!newPw || !confirmPw} />
        </Modal>
      )}

      {/* Skill Reset */}
      {modal === 'skillReset' && resetCategory && (
        <Modal onClose={closeModal}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[resetCategory] }} />
              <h3 className="text-sm font-bold capitalize" style={{ color: 'var(--text)' }}>{resetCategory}</h3>
            </div>
            <button onClick={closeModal}><X size={17} style={{ color: 'var(--text-3)' }} /></button>
          </div>

          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            {SKILL_QUESTIONS[resetCategory].question}
          </p>

          <div className="space-y-2">
            {SKILL_QUESTIONS[resetCategory].options.map(opt => (
              <button
                key={opt.tier}
                onClick={() => setSelTier(opt.tier)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm text-left transition-colors"
                style={{
                  background: selectedTier === opt.tier ? 'rgba(34,197,94,0.07)' : 'var(--surface-2)',
                  border: `1px solid ${selectedTier === opt.tier ? 'rgba(34,197,94,0.3)' : 'var(--border-2)'}`,
                  color: selectedTier === opt.tier ? 'var(--green)' : 'var(--text)',
                }}
              >
                <span>{opt.label}</span>
                <span className="text-xs font-semibold" style={{ color: TIER_COLORS[opt.tier] }}>
                  {TIER_LABELS[opt.tier]}
                </span>
              </button>
            ))}
          </div>

          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            Only your starting tier changes. Streaks and history are not affected.
          </p>

          <button
            onClick={saveSkillReset}
            disabled={loading || selectedTier === null}
            className="w-full py-3.5 rounded-xl font-bold text-sm disabled:opacity-40 transition-opacity"
            style={{ background: 'var(--green)', color: '#000' }}
          >
            {loading ? 'Saving…' : 'Confirm'}
          </button>
        </Modal>
      )}

      {/* Delete Account */}
      {modal === 'delete' && (
        <Modal onClose={closeModal}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2" style={{ color: '#f87171' }}>
              <AlertTriangle size={15} />
              <h3 className="text-sm font-bold">Delete Account</h3>
            </div>
            <button onClick={closeModal}><X size={17} style={{ color: 'var(--text-3)' }} /></button>
          </div>

          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            This permanently deletes all your tasks, streaks, skill levels, and squad memberships. There is no going back.
          </p>

          <div className="space-y-3">
            <div>
              <p className="text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>
                Type <span className="font-bold" style={{ color: '#f87171' }}>DELETE</span> to confirm
              </p>
              <TextInput
                value={deleteText}
                onChange={setDeleteText}
                placeholder="DELETE"
              />
            </div>
            <PasswordInput value={deletePw} onChange={setDeletePw} placeholder="Your password" />
          </div>

          <button
            onClick={deleteAccount}
            disabled={loading || deleteText !== 'DELETE' || !deletePw}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
            style={{
              background: deleteText === 'DELETE' ? '#ef4444' : 'var(--surface-2)',
              color: deleteText === 'DELETE' ? '#fff' : 'var(--text-3)',
              border: deleteText === 'DELETE' ? 'none' : '1px solid var(--border-2)',
            }}
          >
            {loading ? 'Deleting…' : 'Delete My Account'}
          </button>
        </Modal>
      )}

      {/* Add Custom Habit */}
      {modal === 'addHabit' && (
        <Modal onClose={closeModal}>
          <ModalHeader title="Add Custom Habit" onClose={closeModal} />

          <div className="space-y-3">
            <div>
              <p className="text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>Category</p>
              <div className="grid grid-cols-5 gap-1.5">
                {['physical', 'mental', 'confidence', 'spiritual', 'lifestyle'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setNewHabitCat(cat)}
                    className="py-2 rounded-xl text-[11px] font-semibold capitalize transition-colors"
                    style={{
                      background: newHabitCat === cat ? 'rgba(34,197,94,0.08)' : 'var(--surface-2)',
                      border: `1px solid ${newHabitCat === cat ? 'rgba(34,197,94,0.3)' : 'var(--border-2)'}`,
                      color: newHabitCat === cat ? 'var(--green)' : 'var(--text-2)',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>Habit name</p>
              <TextInput value={newHabitName} onChange={setNewHabitName} placeholder="e.g. Cold shower" autoFocus />
            </div>

            <div>
              <p className="text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>Description / target (optional)</p>
              <TextInput value={newHabitDesc} onChange={setNewHabitDesc} placeholder="e.g. 3 minutes cold" />
            </div>
          </div>

          <SaveButton onClick={addCustomHabit} loading={loading} label="Add Habit" disabled={!newHabitName.trim()} />
        </Modal>
      )}

      {/* Add Alarm */}
      {modal === 'addAlarm' && (
        <Modal onClose={closeModal}>
          <ModalHeader title="New Alarm" onClose={closeModal} />

          <div className="space-y-4">
            {/* Time picker */}
            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>Time</p>
              <input
                type="time"
                value={newAlarmTime}
                onChange={e => setNewAlarmTime(e.target.value)}
                className="w-full text-2xl font-black text-center py-3 rounded-xl focus:outline-none"
                style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border-2)' }}
              />
            </div>

            {/* Label */}
            <div>
              <p className="text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>Label</p>
              <TextInput value={newAlarmLabel} onChange={setNewAlarmLabel} placeholder="e.g. Bedtime, Wake up" />
            </div>

            {/* Days */}
            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>Repeat</p>
              <div className="flex gap-2">
                {DAYS.map(d => {
                  const active = newAlarmDays.includes(d)
                  return (
                    <button
                      key={d}
                      onClick={() => toggleAlarmDay(d)}
                      className="flex-1 h-9 rounded-xl text-xs font-bold transition-all"
                      style={{
                        background: active ? 'var(--green)' : 'var(--surface-2)',
                        color: active ? '#000' : 'var(--text-3)',
                        border: `1px solid ${active ? 'var(--green)' : 'var(--border-2)'}`,
                      }}
                    >
                      {DAY_LABELS[d]}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <SaveButton
            onClick={addAlarm}
            loading={loading}
            label="Set Alarm"
            disabled={!newAlarmTime || newAlarmDays.length === 0}
          />
        </Modal>
      )}

      <BottomNav />
    </div>
  )
}
