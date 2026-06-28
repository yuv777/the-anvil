import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function RootPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: skills } = await supabase
      .from('user_skill_levels')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    if (skills && skills.length > 0) {
      redirect('/dashboard')
    } else {
      redirect('/onboarding')
    }
  }

  redirect('/login')
}
