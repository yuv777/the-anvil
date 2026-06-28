import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import OnboardingClient from './OnboardingClient'

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: skillRow } = await supabase
    .from('user_skill_levels')
    .select('completed_onboarding')
    .eq('user_id', user.id)
    .single()

  if (skillRow?.completed_onboarding) {
    redirect('/dashboard')
  }

  return <OnboardingClient userId={user.id} />
}
