import { getSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/** Záloha dat pro admina: cviky, pomůcky, uživatelé a tréninky (PRD FR-15). */
export async function GET() {
  const s = await getSession()
  if (!s || s.profile.role !== 'admin') return new Response('Nedostatečná oprávnění.', { status: 403 })
  const db = createAdminClient()
  const [exercises, equipment, profiles, workouts] = await Promise.all([
    db.from('exercises').select('*').order('name'),
    db.from('equipment').select('*').order('name'),
    db.from('profiles').select('*').order('created_at'),
    db.from('workouts').select('*').order('created_at'),
  ])
  const err = [exercises, equipment, profiles, workouts].find((r) => r.error)
  if (err) return new Response('Záloha se nepodařila.', { status: 500 })
  const body = JSON.stringify({ created_at: new Date().toISOString(), exercises: exercises.data, equipment: equipment.data, profiles: profiles.data, workouts: workouts.data }, null, 1)
  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="efgen-zaloha-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
