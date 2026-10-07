'use server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { generateWorkout } from '@/lib/generator/generate'
import type { GenerateResult } from '@/lib/generator/types'
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
  return generateWorkout(data, parsed.data)
}
