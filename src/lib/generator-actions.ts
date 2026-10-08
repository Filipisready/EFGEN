'use server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { generateWorkout } from '@/lib/generator/generate'
import type { GenerateResult, WorkoutExercise } from '@/lib/generator/types'
import { findReplacements, searchLibrary } from '@/lib/generator/suggest'
import { toWorkoutExercise } from '@/lib/generator/pools'
import type { Exercise } from '@/lib/constants'

const num = (min: number, max: number) => z.coerce.number().int().min(min).max(max)
const optNum = (min: number, max: number) => z.preprocess((v) => (v === '' || v == null ? undefined : v), num(min, max).optional())

const schema = z.object({
  level: z.enum(['začátečník', 'pokročilý', 'expert']),
  muscles: z.array(z.enum(['nohy', 'záda', 'core', 'hrudník', 'ramena', 'paže'])).max(6),
  equipment: z.array(z.string().max(60)).max(40),
  environment: z.enum(['uvnitř', 'venku']),
  format: z.enum(['Tabata', 'TRX', 'CrossFit']),
  subtype: z.enum(['AMRAP', 'EMOM', 'For Time']).optional(),
  segments: z.array(z.object({ type: z.enum(['AMRAP', 'EMOM', 'For Time']), minutes: num(1, 60) })).min(1).max(4).optional(),
  warmupMin: num(0, 30),
  mainMin: num(1, 90),
  cooldownMin: num(0, 30),
  cardioStrength: num(1, 5),
  groupSize: optNum(1, 500),
  groupName: z.string().trim().max(80).optional(),
  title: z.string().trim().max(100).optional(),
  params: z.object({
    workSec: optNum(5, 300), restSec: optNum(0, 300), rounds: optNum(1, 20), pauseSec: optNum(0, 600),
  }).optional(),
})

export async function generateAction(raw: unknown): Promise<GenerateResult> {
  await requireUser()
  const parsed = schema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Zadání obsahuje neplatnou hodnotu: ' + parsed.error.issues[0].message }
  const supabase = await createClient()
  const { data, error } = await supabase.from('exercises').select('*').eq('active', true).limit(2000).returns<Exercise[]>()
  if (error || !data) return { ok: false, error: 'Knihovnu cviků se nepodařilo načíst. Zkuste to znovu.' }
  const input = parsed.data
  if (input.format === 'CrossFit' && input.segments) input.mainMin = input.segments.reduce((a, x) => a + x.minutes, 0)
  return generateWorkout(data, input)
}

// --- Úpravy hotového tréninku (výměna a přidání cviku) ---

const ctxSchema = z.object({
  level: z.enum(['začátečník', 'pokročilý', 'expert']),
  environment: z.enum(['uvnitř', 'venku']),
  equipment: z.array(z.string().max(60)).max(40),
  format: z.enum(['Tabata', 'TRX', 'CrossFit']),
  muscles: z.array(z.string().max(30)).max(10),
  cardioStrength: num(1, 5),
})
const scopeSchema = z.object({
  ctx: ctxSchema,
  key: z.enum(['rozcvička', 'hlavní', 'zklidnění']),
  usedIds: z.array(z.string().max(60)).max(100),
  blockIds: z.array(z.string().max(60)).max(60),
})

async function loadLib(): Promise<Exercise[] | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('exercises').select('*').eq('active', true).limit(2000).returns<Exercise[]>()
  return error || !data ? null : data
}

export type ExerciseOptions = { ok: true; items: WorkoutExercise[] } | { ok: false; error: string }

export async function swapOptionsAction(raw: unknown, targetId: string): Promise<ExerciseOptions> {
  await requireUser()
  const p = scopeSchema.safeParse(raw)
  if (!p.success || typeof targetId !== 'string') return { ok: false, error: 'Neplatný požadavek.' }
  const lib = await loadLib()
  if (!lib) return { ok: false, error: 'Knihovnu se nepodařilo načíst.' }
  const withValue = p.data.ctx.format === 'CrossFit' && p.data.key === 'hlavní'
  const items = findReplacements(lib, p.data, targetId).map((e) => toWorkoutExercise(e, withValue))
  return { ok: true, items }
}

export async function searchExercisesAction(raw: unknown, query: string): Promise<ExerciseOptions> {
  await requireUser()
  const p = scopeSchema.safeParse(raw)
  if (!p.success || typeof query !== 'string' || query.length > 80) return { ok: false, error: 'Neplatný požadavek.' }
  const lib = await loadLib()
  if (!lib) return { ok: false, error: 'Knihovnu se nepodařilo načíst.' }
  const withValue = p.data.ctx.format === 'CrossFit' && p.data.key === 'hlavní'
  return { ok: true, items: searchLibrary(lib, p.data, query).map((e) => toWorkoutExercise(e, withValue)) }
}
