import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import DashboardClient from './DashboardClient'
import { format, subDays } from 'date-fns'

const CATEGORY_EMOJI: Record<string, string> = {
  physical: '🏋️', mental: '🧠', confidence: '🗣️', spiritual: '🧘', lifestyle: '🏠',
}

async function getOrCreateDailyTasks(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  skillLevels: Record<string, number>
): Promise<{ tasks: any[]; error: string | null }> {
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data: existing, error: existingError } = await supabase
    .from('user_daily_tasks')
    .select('*, activity:activity_library(*)')
    .eq('user_id', userId)
    .eq('date', today)

  if (existingError) return { tasks: [], error: `Failed to load tasks: ${existingError.message}` }

  // Include tasks with an activity OR custom tasks (activity is null but base_task is set)
  const validExisting = (existing || []).filter((t: any) => t.activity || t.base_task)

  if (validExisting.length >= 5) {
    return {
      tasks: validExisting.map((t: any) => ({
        id: t.id,
        category: t.activity?.category || t.category,
        activityName: t.activity?.activity_name || t.base_task,
        value: t.activity ? getTierValue(t.activity, skillLevels[t.activity.category] || 1) : t.task_text,
        emoji: CATEGORY_EMOJI[t.activity?.category || t.category] || '🎯',
        completed: t.completed,
        dailyTaskId: t.id,
        activityId: t.activity_id,
      })),
      error: null,
    }
  }

  const { data: libCheck } = await supabase.from('activity_library').select('id').limit(1)
  if (!libCheck || libCheck.length === 0) return { tasks: [], error: 'EMPTY_LIBRARY' }

  const categories = ['physical', 'mental', 'confidence', 'spiritual', 'lifestyle']
  const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd')
  const { data: recentTasks } = await supabase
    .from('user_daily_tasks').select('activity_id').eq('user_id', userId)
    .gte('date', sevenDaysAgo).lt('date', today)
  const recentActivityIds = new Set((recentTasks || []).map((t: any) => t.activity_id).filter(Boolean))

  // Fetch user's custom activities
  const { data: customActivities } = await supabase
    .from('user_custom_activities').select('*').eq('user_id', userId)
  const customByCategory: Record<string, any[]> = {}
  for (const ca of (customActivities || [])) {
    if (!customByCategory[ca.category]) customByCategory[ca.category] = []
    customByCategory[ca.category].push({ ...ca, isCustom: true })
  }

  const tasks: any[] = []
  const errors: string[] = []

  for (const category of categories) {
    const { data: activities, error: actErr } = await supabase
      .from('activity_library').select('*').eq('category', category)

    if (actErr || !activities?.length) {
      errors.push(`${category}: ${actErr?.message || 'no activities'}`)
      continue
    }

    const fresh = activities.filter((a: any) => !recentActivityIds.has(a.id))
    const libPool = fresh.length > 0 ? fresh : activities
    const customPool = (customByCategory[category] || [])
    const fullPool = [...libPool, ...customPool]
    const chosen = fullPool[Math.floor(Math.random() * fullPool.length)]
    const tier = skillLevels[category] || 1

    let insertData: any
    if (chosen.isCustom) {
      insertData = {
        user_id: userId, date: today, category,
        task_text: chosen.value_description || chosen.activity_name,
        base_task: chosen.activity_name,
        difficulty_tier: tier, completed: false,
      }
    } else {
      const value = getTierValue(chosen, tier)
      insertData = {
        user_id: userId, activity_id: chosen.id, date: today, category,
        task_text: value, base_task: chosen.activity_name,
        difficulty_tier: tier, completed: false,
      }
    }

    const { data: inserted, error: insertError } = await supabase
      .from('user_daily_tasks').insert(insertData).select().single()

    if (insertError) { errors.push(`Insert failed for ${category}: ${insertError.message}`); continue }

    if (inserted) {
      tasks.push({
        id: inserted.id,
        category,
        activityName: chosen.activity_name,
        value: insertData.task_text,
        emoji: CATEGORY_EMOJI[category] || '🎯',
        completed: false,
        dailyTaskId: inserted.id,
        activityId: inserted.activity_id || null,
      })
    }
  }

  return { tasks, error: errors.length > 0 && tasks.length === 0 ? errors.join(' | ') : null }
}

function getTierValue(activity: any, tier: number): string {
  return activity[`tier_${tier}_value`] || activity['tier_1_value'] || ''
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = format(new Date(), 'yyyy-MM-dd')
  const currentMonth = format(new Date(), 'yyyy-MM')
  const sevenDaysAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd')

  const [profileResult, skillResult, streakResult, weeklyResult] = await Promise.all([
    supabase.from('profiles').select('username').eq('id', user.id).single(),
    supabase.from('user_skill_levels').select('*').eq('user_id', user.id).single(),
    supabase.from('user_streaks').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_daily_tasks').select('date, completed')
      .eq('user_id', user.id).gte('date', sevenDaysAgo).lte('date', today),
  ])

  const profile = profileResult.data
  const skillRow = skillResult.data

  if (!skillRow || !skillRow.completed_onboarding) redirect('/onboarding')

  // ── Monthly streak freeze refresh ──
  const streakFreezes: number = skillRow.streak_freezes ?? 0
  const lastFreezeGrant: string = skillRow.last_freeze_grant || ''
  let effectiveFreezes = streakFreezes
  if (lastFreezeGrant !== currentMonth) {
    const newFreezes = Math.max(streakFreezes, 2)
    await supabase.from('user_skill_levels')
      .update({ streak_freezes: newFreezes, last_freeze_grant: currentMonth })
      .eq('user_id', user.id)
    effectiveFreezes = newFreezes
  }

  // ── Weekly stats ──
  const weeklyMap: Record<string, { completed: number; total: number }> = {}
  for (const t of (weeklyResult.data || [])) {
    if (!weeklyMap[t.date]) weeklyMap[t.date] = { completed: 0, total: 0 }
    weeklyMap[t.date].total++
    if (t.completed) weeklyMap[t.date].completed++
  }
  const weeklyStats = Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
    return { date, ...(weeklyMap[date] || { completed: 0, total: 0 }) }
  })
  const perfectDaysThisWeek = weeklyStats.filter(d => d.total >= 5 && d.completed === d.total).length

  const skillLevels: Record<string, number> = {
    physical: skillRow.physical_tier || 1, mental: skillRow.mental_tier || 1,
    confidence: skillRow.confidence_tier || 1, spiritual: skillRow.spiritual_tier || 1,
    lifestyle: skillRow.lifestyle_tier || 1,
  }

  const streak = streakResult.data
  const currentStreak  = streak?.current_streak   || 0
  const longestStreak  = streak?.longest_streak   || 0
  const lastCompletion = streak?.last_completion_date || null

  const { tasks, error: taskError } = await getOrCreateDailyTasks(supabase, user.id, skillLevels)

  const overallTier = skillRow.current_tier || 1
  const sharedPerfectDays = skillRow.perfect_days_in_tier || 0
  const daysUntilUpgrade = overallTier < 4 ? Math.max(0, 7 - sharedPerfectDays) : 0

  return (
    <DashboardClient
      username={profile?.username || 'Warrior'}
      tasks={tasks}
      taskError={taskError}
      currentStreak={currentStreak}
      longestStreak={longestStreak}
      overallTier={overallTier}
      skillLevels={skillLevels}
      perfectDays={{ physical: sharedPerfectDays, mental: sharedPerfectDays, confidence: sharedPerfectDays, spiritual: sharedPerfectDays, lifestyle: sharedPerfectDays }}
      daysUntilUpgrade={daysUntilUpgrade}
      userId={user.id}
      streakFreezes={effectiveFreezes}
      lastCompletionDate={lastCompletion}
      weeklyStats={weeklyStats}
      perfectDaysThisWeek={perfectDaysThisWeek}
    />
  )
}
