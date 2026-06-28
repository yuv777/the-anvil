import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import JournalClient from './JournalClient'
import { format, subDays } from 'date-fns'

export default async function JournalPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  const { data: entries } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', thirtyDaysAgo)
    .order('date', { ascending: false })

  return <JournalClient userId={user.id} entries={entries || []} />
}
