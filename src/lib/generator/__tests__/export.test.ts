import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as XLSX from 'xlsx'
import type { Exercise } from '@/lib/constants'
import { generateWorkout } from '../generate'
import { setExerciseNote } from '../edit'
import { mulberry32 } from '../rng'
import { workoutSchema } from '@/lib/export/workout-schema'
import { buildEmail } from '@/lib/export/email'
import type { GeneratorInput } from '../types'

const list = (v: unknown) => String(v ?? '').split(',').map((s) => s.trim()).filter(Boolean)
const wb = XLSX.readFile('docs/cviky_import.xlsx')
const lib: Exercise[] = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets['Cviky']).map((r, i) => ({
  id: `ex${i}`, name: r.nazev, alt_name: r.alternativni_nazev ?? null, muscle: r.partie, level: r.uroven,
  equipment: list(r.pomucky).filter((x) => x !== 'vlastní váha'), environment: r.prostredi, formats: list(r.formaty),
  blocks: list(r.bloky), cardio_strength: Number(r.kardio_sila), movement: r.pohybovy_vzorec,
  default_value: r.vychozi_hodnota ?? null, unit: r.jednotka ?? 'opakování', description: r.popis, video_url: r.video_url ?? null, active: true,
}))
const ALL_EQ = [...new Set(lib.flatMap((e) => e.equipment))]

test('každý vygenerovaný trénink projde kontrolou před exportem (200 zadání)', () => {
  const rng = mulberry32(7)
  const pick = <T,>(a: T[]) => a[Math.floor(rng() * a.length)]
  for (let i = 0; i < 200; i++) {
    const format = pick(['Tabata', 'TRX', 'CrossFit'] as const)
    const input: GeneratorInput = {
      level: pick(['začátečník', 'pokročilý', 'expert'] as const), environment: pick(['uvnitř', 'venku'] as const), muscles: [],
      equipment: format === 'TRX' ? ['TRX'] : ALL_EQ.filter(() => rng() < 0.6), format,
      segments: format === 'CrossFit' ? [{ type: pick(['AMRAP', 'EMOM', 'For Time'] as const), minutes: 12 }, { type: 'EMOM', minutes: 8 }] : undefined,
      warmupMin: 5, mainMin: 20, cooldownMin: 5, cardioStrength: 3, seed: i, groupSize: 12, groupName: 'Skupina', title: 'Žlutý čtvrtek',
    }
    const r = generateWorkout(lib, input)
    if (!r.ok) continue
    const res = workoutSchema.safeParse(JSON.parse(JSON.stringify(r.workout)))
    assert.ok(res.success, JSON.stringify(res.success ? '' : res.error.issues[0]))
  }
})

test('kontrola odmítne nesmysl a příliš dlouhé texty', () => {
  assert.equal(workoutSchema.safeParse({}).success, false)
  assert.equal(workoutSchema.safeParse(null).success, false)
})

test('HTML e-mailu ošetřuje znaky a obsahuje bloky, časy a poznámky', () => {
  const r = generateWorkout(lib, { level: 'pokročilý', muscles: [], equipment: ALL_EQ.filter((x) => x !== 'TRX'), environment: 'uvnitř', format: 'CrossFit', segments: [{ type: 'AMRAP', minutes: 10 }], warmupMin: 3, mainMin: 10, cooldownMin: 2, cardioStrength: 3, seed: 5, title: 'Test <b>&</b>' })
  assert.ok(r.ok)
  let w = r.workout
  w = setExerciseNote(w, 1, 0, '<script>alert(1)</script>')
  w = { ...w, note: 'Připravit "bedny"' }
  const { subject, html, text } = buildEmail(w)
  assert.ok(subject.includes('EFGEN'))
  assert.ok(!html.includes('<script>') && html.includes('&lt;script&gt;'))
  assert.ok(html.includes('Test &lt;b&gt;&amp;&lt;/b&gt;'))
  assert.ok(html.includes('AMRAP 10 min') && html.includes('Rozcvička') && html.includes('Zklidnění'))
  assert.ok(html.includes('Připravit &quot;bedny&quot;'))
  assert.ok(text.includes('AMRAP 10 min') && text.includes('Poznámka: Připravit "bedny"'))
})
