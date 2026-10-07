import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Profile = { id: string; email: string; display_name: string | null; role: 'trener' | 'admin' }

export const getSession = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('id,email,display_name,role').eq('id', user.id).single<Profile>()
  return profile ? { user, profile } : null
})

export async function requireUser() {
  const s = await getSession()
  if (!s) redirect('/prihlaseni')
  return s
}

// Kontrola role probíhá na serveru (PRD kap. 10).
export async function requireAdmin() {
  const s = await requireUser()
  if (s.profile.role !== 'admin') redirect('/app')
  return s
}

export function safeNext(next: unknown, fallback = '/app') {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : fallback
}
