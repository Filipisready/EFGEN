'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { workoutSchema } from '@/lib/export/workout-schema'
import type { GeneratedWorkout } from '@/lib/generator/types'

export type SaveResult = { ok: true; id: string } | { ok: false; error: string }

const MAX_WORKOUTS = 1000
const rowOf = (w: GeneratedWorkout) => ({
  title: w.title, workout_date: w.date, group_name: w.groupName ?? null, group_size: w.groupSize ?? null,
  format: w.format, subtype: w.subtype ?? null, params: w.params, content: w, note: w.note ?? null,
})

/** Uloží trénink jako úplný snímek (PRD FR-61). S `id` přepíše vlastní uložený trénink. */
export async function saveWorkoutAction(raw: unknown, id?: string): Promise<SaveResult> {
  const { profile } = await requireUser()
  const parsed = workoutSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Trénink se nepodařilo zpracovat.' }
  const w = parsed.data as GeneratedWorkout
  const supabase = await createClient()
  if (id) {
    const { data, error } = await supabase.from('workouts').update(rowOf(w)).eq('id', id).eq('user_id', profile.id).select('id').maybeSingle()
    if (error || !data) return { ok: false, error: 'Uložení se nepovedlo. Trénink možná už neexistuje.' }
    revalidatePath('/app/historie')
    return { ok: true, id: data.id }
  }
  const { count } = await supabase.from('workouts').select('id', { count: 'exact', head: true })
  if ((count ?? 0) >= MAX_WORKOUTS) return { ok: false, error: `Dosáhli jste limitu ${MAX_WORKOUTS} uložených tréninků. Některé smažte.` }
  const { data, error } = await supabase.from('workouts').insert({ user_id: profile.id, ...rowOf(w) }).select('id').single()
  if (error) return { ok: false, error: 'Uložení se nepovedlo. Zkuste to znovu.' }
  revalidatePath('/app/historie')
  return { ok: true, id: data.id }
}

export async function deleteWorkoutAction(id: string) {
  const { profile } = await requireUser()
  const supabase = await createClient()
  await supabase.from('workouts').delete().eq('id', id).eq('user_id', profile.id)
  revalidatePath('/app/historie')
  redirect('/app/historie')
}

/** Duplikace: z uloženého tréninku vznikne nová kopie k úpravě (PRD FR-63). */
export async function duplicateWorkoutAction(id: string) {
  const { profile } = await requireUser()
  const supabase = await createClient()
  const { data } = await supabase.from('workouts').select('content').eq('id', id).eq('user_id', profile.id).maybeSingle()
  const parsed = workoutSchema.safeParse(data?.content)
  if (!parsed.success) redirect('/app/historie')
  const w = { ...(parsed.data as GeneratedWorkout), title: `${parsed.data.title} (kopie)`.slice(0, 100), date: new Date().toISOString().slice(0, 10) }
  const { data: ins, error } = await supabase.from('workouts').insert({ user_id: profile.id, ...rowOf(w) }).select('id').single()
  if (error || !ins) redirect('/app/historie')
  revalidatePath('/app/historie')
  redirect(`/app/historie/${ins.id}`)
}
