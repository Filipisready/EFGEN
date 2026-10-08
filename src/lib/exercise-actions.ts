'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { BLOCKS, ENVIRONMENTS, FORMATS, LEVELS, MOVEMENTS, MUSCLES, UNITS } from '@/lib/constants'

export type ExerciseState = { error?: string; values?: Record<string, string | string[]> }

const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v)

const schema = z.object({
  name: z.string().trim().min(2, 'Název je povinný.').max(120),
  alt_name: z.preprocess(emptyToNull, z.string().trim().max(120).nullable()),
  muscle: z.enum(MUSCLES, 'Vyberte svalovou partii.'),
  level: z.enum(LEVELS, 'Vyberte úroveň.'),
  equipment: z.array(z.string()),
  environment: z.enum(ENVIRONMENTS, 'Vyberte prostředí.'),
  formats: z.array(z.enum(FORMATS)).min(1, 'Vyberte alespoň jeden formát.'),
  blocks: z.array(z.enum(BLOCKS)).min(1, 'Vyberte alespoň jeden blok (rozcvička, hlavní, zklidnění).'),
  cardio_strength: z.coerce.number().int().min(1).max(5),
  movement: z.enum(MOVEMENTS, 'Vyberte pohybový vzorec.'),
  default_value: z.preprocess(emptyToNull, z.coerce.number().int().positive('Výchozí hodnota musí být kladné číslo.').nullable()),
  unit: z.enum(UNITS),
  description: z.string().trim().min(5, 'Popis je povinný.').max(500),
  video_url: z.preprocess(emptyToNull, z.string().trim().url('Neplatný odkaz.').regex(/^https?:\/\//, 'Odkaz musí začínat http(s)://').nullable()),
  active: z.boolean(),
})

export async function saveExercise(id: string | null, _: ExerciseState, fd: FormData): Promise<ExerciseState> {
  await requireAdmin()
  const values: Record<string, string | string[]> = {}
  for (const k of new Set(fd.keys())) {
    const all = fd.getAll(k).map(String)
    values[k] = ['equipment', 'formats', 'blocks'].includes(k) ? all : all[0]
  }
  const parsed = schema.safeParse({
    name: fd.get('name'), alt_name: fd.get('alt_name'), muscle: fd.get('muscle'), level: fd.get('level'),
    equipment: fd.getAll('equipment'), environment: fd.get('environment'), formats: fd.getAll('formats'),
    blocks: fd.getAll('blocks'), cardio_strength: fd.get('cardio_strength'), movement: fd.get('movement'),
    default_value: fd.get('default_value'), unit: fd.get('unit'), description: fd.get('description'),
    video_url: fd.get('video_url'), active: fd.get('active') === 'on',
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message, values }
  const supabase = await createClient()
  const { error } = id
    ? await supabase.from('exercises').update(parsed.data).eq('id', id)
    : await supabase.from('exercises').insert(parsed.data)
  if (error) {
    return { error: error.code === '23505' ? 'Cvik s tímto názvem už existuje.' : 'Uložení se nepovedlo. Zkuste to znovu.', values }
  }
  revalidatePath('/admin/cviky')
  redirect('/admin/cviky')
}

export async function toggleExercise(id: string, active: boolean) {
  await requireAdmin()
  const supabase = await createClient()
  await supabase.from('exercises').update({ active }).eq('id', id)
  revalidatePath('/admin/cviky')
}

export async function deleteExercise(id: string) {
  await requireAdmin()
  const supabase = await createClient()
  await supabase.from('exercises').delete().eq('id', id)
  revalidatePath('/admin/cviky')
  redirect('/admin/cviky')
}

export async function addEquipment(fd: FormData) {
  await requireAdmin()
  const formats = fd.getAll('formats').map(String).filter((f) => (FORMATS as readonly string[]).includes(f))
  const parsed = z.object({ name: z.string().trim().min(2).max(60), note: z.preprocess(emptyToNull, z.string().trim().max(200).nullable()), cf_label: z.preprocess(emptyToNull, z.string().trim().max(60).nullable()) })
    .safeParse({ name: fd.get('name'), note: fd.get('note'), cf_label: fd.get('cf_label') })
  if (!parsed.success || !formats.length) redirect('/admin/pomucky?chyba=' + encodeURIComponent('Zadejte název pomůcky (min. 2 znaky) a vyberte alespoň jeden formát.'))
  const supabase = await createClient()
  const { error } = await supabase.from('equipment').insert({ ...parsed.data, formats })
  if (error) redirect('/admin/pomucky?chyba=' + encodeURIComponent(error.code === '23505' ? 'Taková pomůcka už existuje.' : 'Uložení se nepovedlo.'))
  revalidatePath('/admin/pomucky')
  redirect('/admin/pomucky')
}

export async function updateEquipment(name: string, fd: FormData) {
  await requireAdmin()
  const formats = fd.getAll('formats').map(String).filter((f) => (FORMATS as readonly string[]).includes(f))
  const parsed = z.object({ note: z.preprocess(emptyToNull, z.string().trim().max(200).nullable()), cf_label: z.preprocess(emptyToNull, z.string().trim().max(60).nullable()) })
    .safeParse({ note: fd.get('note'), cf_label: fd.get('cf_label') })
  if (!parsed.success || !formats.length) redirect('/admin/pomucky?chyba=' + encodeURIComponent('Vyberte alespoň jeden formát a zkontrolujte pole.'))
  const supabase = await createClient()
  const { error } = await supabase.from('equipment').update({ ...parsed.data, formats }).eq('name', name)
  if (error) redirect('/admin/pomucky?chyba=' + encodeURIComponent('Uložení se nepovedlo.'))
  revalidatePath('/admin/pomucky')
  redirect('/admin/pomucky')
}

export async function deleteEquipment(name: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { count } = await supabase.from('exercises').select('id', { count: 'exact', head: true }).contains('equipment', [name])
  if (count) redirect('/admin/pomucky?chyba=' + encodeURIComponent(`Pomůcku „${name}“ používá ${count} cviků, nejdřív ji u nich odeberte.`))
  await supabase.from('equipment').delete().eq('name', name)
  revalidatePath('/admin/pomucky')
  redirect('/admin/pomucky')
}
