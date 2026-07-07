import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { format } from 'date-fns'
import SquadDetailClient from './SquadDetailClient'

export default async function SquadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: squad } = await supabase.from('squads').select('*').eq('id', id).single()
  if (!squad) notFound()

  const { data: memberRows } = await supabase
    .from('squad_members').select('user_id, joined_at').eq('squad_id', id)

  const members = memberRows || []
  const isMember = members.some((m: any) => m.user_id === user.id)
  const memberIds = members.map((m: any) => m.user_id)
  const today = format(new Date(), 'yyyy-MM-dd')

  const admin = createAdminSupabaseClient()

  const [profilesResult, streaksResult, challengesResult] = await Promise.all([
    memberIds.length > 0
      ? admin.from('profiles').select('id, username').in('id', memberIds)
      : Promise.resolve({ data: [] }),
    memberIds.length > 0
      ? admin.from('user_streaks').select('user_id, current_streak, longest_streak, last_completion_date').in('user_id', memberIds)
      : Promise.resolve({ data: [] }),
    supabase.from('squad_challenges').select('*').eq('squad_id', id).order('created_at'),
  ])

  const profileMap: Record<string, string> = {}
  for (const p of (profilesResult.data || [])) {
    profileMap[(p as any).id] = (p as any).username || 'Unknown'
  }

  const streakMap: Record<string, { current: number; longest: number; activeToday: boolean }> = {}
  for (const s of (streaksResult.data || [])) {
    streakMap[(s as any).user_id] = {
      current: (s as any).current_streak || 0,
      longest: (s as any).longest_streak || 0,
      activeToday: (s as any).last_completion_date === today,
    }
  }

  const leaderboard = members
    .map((m: any) => ({
      user_id: m.user_id,
      username: profileMap[m.user_id] || 'Unknown',
      current_streak: streakMap[m.user_id]?.current || 0,
      longest_streak: streakMap[m.user_id]?.longest || 0,
      active_today: streakMap[m.user_id]?.activeToday || false,
    }))
    .sort((a, b) => b.current_streak - a.current_streak)

  const activeTodayCount = leaderboard.filter(e => e.active_today).length

  // Fetch challenge completions
  const rawChallenges = (challengesResult.data || []) as any[]
  const challengeIds = rawChallenges.map(c => c.id)
  const completionsResult = challengeIds.length > 0
    ? await supabase.from('squad_challenge_completions').select('challenge_id, user_id').in('challenge_id', challengeIds)
    : { data: [] }

  const completionMap: Record<string, string[]> = {}
  for (const comp of (completionsResult.data || [])) {
    const c = comp as any
    if (!completionMap[c.challenge_id]) completionMap[c.challenge_id] = []
    completionMap[c.challenge_id].push(c.user_id)
  }

  const challenges = rawChallenges.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description || '',
    ends_at: c.ends_at,
    created_by: c.created_by,
    completions: completionMap[c.id] || [],
  }))

  return (
    <SquadDetailClient
      squad={{ id: squad.id, name: squad.name, description: squad.description, join_code: squad.join_code }}
      leaderboard={leaderboard}
      activeTodayCount={activeTodayCount}
      isMember={isMember}
      currentUserId={user.id}
      initialChallenges={challenges}
    />
  )
}
