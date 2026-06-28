import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileResult, skillResult] = await Promise.all([
    supabase.from('profiles').select('username, display_name').eq('id', user.id).single(),
    supabase.from('user_skill_levels')
      .select('physical_tier, mental_tier, confidence_tier, spiritual_tier, lifestyle_tier')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const profile = profileResult.data
  const skills = skillResult.data

  const skillLevels = [
    { category: 'physical',   current_tier: skills?.physical_tier   || 1 },
    { category: 'mental',     current_tier: skills?.mental_tier     || 1 },
    { category: 'confidence', current_tier: skills?.confidence_tier || 1 },
    { category: 'spiritual',  current_tier: skills?.spiritual_tier  || 1 },
    { category: 'lifestyle',  current_tier: skills?.lifestyle_tier  || 1 },
  ]

  return (
    <SettingsClient
      userId={user.id}
      username={profile?.username || user.email?.split('@')[0] || 'User'}
      displayName={(profile as any)?.display_name || profile?.username || user.email?.split('@')[0] || 'User'}
      email={user.email || ''}
      skillLevels={skillLevels}
    />
  )
}
