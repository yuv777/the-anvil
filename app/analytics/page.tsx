import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import AnalyticsClient from './AnalyticsClient'
import { format, subDays } from 'date-fns'

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = format(subDays(new Date(), 90), 'yyyy-MM-dd')

  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  const [recentResult, allResult, streakResult, skillResult, metricsResult] = await Promise.all([
    supabase
      .from('user_daily_tasks')
      .select('date, category, completed, base_task, task_text')
      .eq('user_id', user.id)
      .gte('date', ninetyDaysAgo)
      .order('date'),
    supabase
      .from('user_daily_tasks')
      .select('category, completed')
      .eq('user_id', user.id),
    supabase.from('user_streaks').select('*').eq('user_id', user.id).single(),
    supabase.from('user_skill_levels').select('*').eq('user_id', user.id).single(),
    supabase.from('body_metrics').select('*')
      .eq('user_id', user.id).gte('date', thirtyDaysAgo).order('date'),
  ])

  return (
    <AnalyticsClient
      recentTasks={recentResult.data || []}
      allTasks={allResult.data || []}
      streak={streakResult.data}
      skillRow={skillResult.data}
      bodyMetrics={metricsResult.data || []}
      userId={user.id}
    />
  )
}
