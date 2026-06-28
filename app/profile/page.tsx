import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import ProfileClient from './ProfileClient'
import { getAchievementsToAward } from '@/lib/achievements'
import { format } from 'date-fns'

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = format(new Date(), 'yyyy-MM-dd')

  const [profileResult, skillResult, streakResult, achievementsResult, todayTasksResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_skill_levels').select('*').eq('user_id', user.id).single(),
    supabase.from('user_streaks').select('*').eq('user_id', user.id).single(),
    supabase.from('user_achievements').select('achievement_id, earned_at').eq('user_id', user.id),
    supabase.from('user_daily_tasks').select('base_task, completed').eq('user_id', user.id).eq('date', today),
  ])

  const profile = profileResult.data
  const skillRow = skillResult.data
  const streak = streakResult.data
  let earnedAchievements = (achievementsResult.data || []) as { achievement_id: string; earned_at: string }[]

  const currentStreak = streak?.current_streak || 0
  const longestStreak = streak?.longest_streak || 0
  const overallTier = skillRow?.current_tier || 1
  const skillLevels: Record<string, number> = {
    physical:   skillRow?.physical_tier   || 1,
    mental:     skillRow?.mental_tier     || 1,
    confidence: skillRow?.confidence_tier || 1,
    spiritual:  skillRow?.spiritual_tier  || 1,
    lifestyle:  skillRow?.lifestyle_tier  || 1,
  }

  const todayTasks = todayTasksResult.data || []
  const completedToday = todayTasks.filter((t: any) => t.completed)
  const taskNames = completedToday.map((t: any) => t.base_task || '')
  const earnedIds = new Set(earnedAchievements.map(a => a.achievement_id))

  // Award any achievements the user has earned but not yet received
  const toAward = getAchievementsToAward({
    currentStreak,
    longestStreak,
    overallTier,
    skillLevels,
    completedTasksToday: completedToday.length,
    perfectDaysThisWeek: 0,
    taskNames,
    earnedIds,
  })

  if (toAward.length > 0) {
    const { data: newlyAwarded } = await supabase
      .from('user_achievements')
      .upsert(
        toAward.map(id => ({ user_id: user.id, achievement_id: id })),
        { onConflict: 'user_id,achievement_id' }
      )
      .select('achievement_id, earned_at')

    if (newlyAwarded && newlyAwarded.length > 0) {
      earnedAchievements = [...earnedAchievements, ...(newlyAwarded as { achievement_id: string; earned_at: string }[])]
    } else {
      // Fallback: re-fetch after upsert
      const { data: refreshed } = await supabase
        .from('user_achievements')
        .select('achievement_id, earned_at')
        .eq('user_id', user.id)
      if (refreshed) earnedAchievements = refreshed as { achievement_id: string; earned_at: string }[]
    }
  }

  const sharedPerfectDays = skillRow?.perfect_days_in_tier || 0
  const skills = skillRow ? [
    { category: 'physical',   current_tier: skillRow.physical_tier   || 1, perfect_days_in_tier: sharedPerfectDays },
    { category: 'mental',     current_tier: skillRow.mental_tier     || 1, perfect_days_in_tier: sharedPerfectDays },
    { category: 'confidence', current_tier: skillRow.confidence_tier || 1, perfect_days_in_tier: sharedPerfectDays },
    { category: 'spiritual',  current_tier: skillRow.spiritual_tier  || 1, perfect_days_in_tier: sharedPerfectDays },
    { category: 'lifestyle',  current_tier: skillRow.lifestyle_tier  || 1, perfect_days_in_tier: sharedPerfectDays },
  ] : []

  return (
    <ProfileClient
      username={profile?.username || user.email || 'Warrior'}
      email={user.email || ''}
      skills={skills}
      currentStreak={currentStreak}
      longestStreak={longestStreak}
      perfectDaysInTier={sharedPerfectDays}
      earnedAchievements={earnedAchievements}
    />
  )
}
