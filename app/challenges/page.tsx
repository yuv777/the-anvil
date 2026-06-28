import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import ChallengesClient from './ChallengesClient'
import { format } from 'date-fns'

export default async function ChallengesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = format(new Date(), 'yyyy-MM-dd')

  const [enrollmentsResult, completionsResult] = await Promise.all([
    supabase.from('user_programs').select('*').eq('user_id', user.id),
    supabase.from('user_program_days').select('*').eq('user_id', user.id),
  ])

  return (
    <ChallengesClient
      userId={user.id}
      today={today}
      enrollments={enrollmentsResult.data || []}
      completions={completionsResult.data || []}
    />
  )
}
