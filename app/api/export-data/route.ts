import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [tasksResult, skillsResult, squadsResult, streakResult] = await Promise.all([
    supabase.from('user_daily_tasks').select('date, category, base_task, task_text, completed').eq('user_id', user.id).order('date'),
    supabase.from('user_skill_levels').select('*').eq('user_id', user.id).single(),
    supabase.from('squad_members').select('squad_id, joined_at, squads(name)').eq('user_id', user.id),
    supabase.from('user_streaks').select('*').eq('user_id', user.id).single(),
  ])

  const lines: string[] = []

  // Header
  lines.push('THE ANVIL — DATA EXPORT')
  lines.push(`Exported: ${new Date().toISOString()}`)
  lines.push(`User: ${user.email}`)
  lines.push('')

  // Streak
  const streak = streakResult.data
  if (streak) {
    lines.push('STREAK DATA')
    lines.push(`Current Streak,${streak.current_streak}`)
    lines.push(`Longest Streak,${streak.longest_streak}`)
    lines.push(`Last Completion,${streak.last_completion_date || ''}`)
    lines.push('')
  }

  // Skill levels
  const skills = skillsResult.data
  if (skills) {
    lines.push('SKILL TIERS')
    lines.push('Category,Tier')
    for (const cat of ['physical', 'mental', 'confidence', 'spiritual', 'lifestyle']) {
      lines.push(`${cat},${skills[`${cat}_tier`] || 1}`)
    }
    lines.push('')
  }

  // Squad memberships
  const squads = squadsResult.data || []
  if (squads.length > 0) {
    lines.push('SQUAD MEMBERSHIPS')
    lines.push('Squad Name,Joined At')
    for (const s of squads) {
      const name = (s.squads as any)?.name || s.squad_id
      lines.push(`"${name}",${s.joined_at}`)
    }
    lines.push('')
  }

  // Task completions
  const tasks = tasksResult.data || []
  if (tasks.length > 0) {
    lines.push('TASK COMPLETIONS')
    lines.push('Date,Category,Task,Completed')
    for (const t of tasks) {
      const taskName = (t.task_text || t.base_task || '').replace(/"/g, '""')
      lines.push(`${t.date},${t.category},"${taskName}",${t.completed ? 'Yes' : 'No'}`)
    }
  }

  const csv = lines.join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="the-anvil-data-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
