import { z } from 'zod'

const str = (max: number) => z.string().max(max)
const exercise = z.object({
  id: str(60), name: str(160), altName: str(160).optional(), description: str(600), videoUrl: str(500).nullable(),
  muscle: str(30), level: str(30), equipment: z.array(str(60)).max(10), valueText: str(30).optional(), note: str(120).optional(), userNote: str(300).optional(),
})
const block = z.object({
  key: z.enum(['rozcvička', 'hlavní', 'zklidnění']), minutes: z.number().min(0).max(300), label: str(60).optional(),
  type: z.enum(['AMRAP', 'EMOM', 'For Time']).optional(), structure: str(400), exercises: z.array(exercise).max(40),
})

/** Ověření tréninku přijatého z prohlížeče před exportem nebo odesláním. */
export const workoutSchema = z.object({
  title: str(100), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), groupName: str(80).optional(), groupSize: z.number().int().min(1).max(500).optional(),
  format: z.enum(['Tabata', 'TRX', 'CrossFit']), subtype: z.enum(['AMRAP', 'EMOM', 'For Time']).optional(),
  totalMinutes: z.number().min(0).max(600), blocks: z.array(block).min(1).max(8),
  params: z.object({ workSec: z.number(), restSec: z.number(), rounds: z.number(), pauseSec: z.number() }),
  context: z.object({
    level: z.enum(['začátečník', 'pokročilý', 'expert']), environment: z.enum(['uvnitř', 'venku']), equipment: z.array(str(60)).max(40),
    format: z.enum(['Tabata', 'TRX', 'CrossFit']), muscles: z.array(str(30)).max(10), cardioStrength: z.number().int().min(1).max(5),
  }),
  note: str(1000).optional(), warnings: z.array(str(600)).max(10),
})
