import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import SquadsClient from './SquadsClient'

export default async function SquadsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myMemberships } = await supabase
    .from('squad_members')
    .select('squad_id, squads(*)')
    .eq('user_id', user.id)

  const mySquads = (myMemberships || [])
    .map((m: any) => m.squads)
    .filter(Boolean)

  const { data: allSquads } = await supabase
    .from('squads')
    .select('*, squad_members(count)')
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <SquadsClient
      userId={user.id}
      mySquads={mySquads}
      allSquads={allSquads || []}
    />
  )
}
