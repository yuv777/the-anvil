import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import AlarmDismissClient from './AlarmDismissClient'

export default async function AlarmDismissPage({ searchParams }: { searchParams: Promise<{ qr?: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const params = await searchParams
  const requireQr = params.qr === '1'
  return <AlarmDismissClient userId={user.id} requireQr={requireQr} />
}
