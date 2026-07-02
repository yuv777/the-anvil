import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import AlarmDismissClient from './AlarmDismissClient'

export default async function AlarmDismissPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <AlarmDismissClient userId={user.id} />
}
