import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as XLSX from 'xlsx'
import type { Exercise } from '@/lib/constants'
import { generateWorkout } from '../generate'
import { removeExercise, setParams } from '../edit'
import { workoutSchema } from '@/lib/export/workout-schema'
import { blockHeading, blockSummary } from '../display'
import type { GeneratedWorkout, GeneratorInput } from '../types'

const list = (v: unknown) => String(v ?? '').split(',').map((s) => s.trim()).filter(Boolean)
const wb = XLSX.readFile('docs/cviky_import.xlsx')
const lib: Exercise[] = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets['Cviky']).map((r, i) => ({
  id: `ex${i}`, name: r.nazev, alt_name: r.alternativni_nazev ?? null, muscle: r.partie, level: r.uroven,
  equipment: list(r.pomucky).filter((x) => x !== 'vlastní váha'), environment: r.prostredi, formats: list(r.formaty),
  blocks: list(r.bloky), cardio_strength: Number(r.kardio_sila), movement: r.pohybovy_vzorec,
  default_value: r.vychozi_hodnota ?? null, unit: r.jednotka ?? 'opakování', description: r.popis, video_url: r.video_url ?? null, active: true,
}))
const ALL_EQ = [...new Set(lib.flatMap((e) => e.equipment))]
const base: GeneratorInput = { level: 'pokročilý', muscles: [], equipment: ALL_EQ, environment: 'uvnitř', format: 'Kruhový trénink', warmupMin: 5, mainMin: 20, cooldownMin: 5, cardioStrength: 4, seed: 3 }
const gen = (o: Partial<GeneratorInput>): GeneratedWorkout => { const r = generateWorkout(lib, { ...base, ...o }); assert.ok(r.ok, r.ok ? '' : r.error); return r.workout }
const mains = (w: GeneratedWorkout) => w.blocks.filter((b) => b.key === 'hlavní')

test('silové bloky A, B, C: 3 × 5 cviků, 3 série po 3 opakováních, pauzy 2 min', () => {
  const w = gen({ params: { blocks: 3, perBlock: 5, rounds: 3, mode: 'opak', reps: 3, restBetweenSec: 0, pauseSec: 120, pauseBlocksSec: 120 } })
  const m = mains(w)
  assert.equal(m.length, 3)
  assert.deepEqual(m.map((b) => b.label), ['Blok A', 'Blok B', 'Blok C'])
  assert.ok(m.every((b) => b.exercises.length === 5))
  assert.ok(m.every((b) => b.exercises.every((e) => e.valueText === '3×')))
  // blok: 5 cviků × 3 série × (3 × 4 s) + 2 × 120 s pauza = 420 s = 7 min
  assert.ok(m.every((b) => b.minutes === 7), m.map((b) => b.minutes).join(','))
  // celkem: 5 + 3 × 7 + 2 × 2 min pauzy mezi bloky + 5
  assert.equal(w.totalMinutes, 5 + 21 + 4 + 5)
  const ids = m.flatMap((b) => b.exercises.map((e) => e.id))
  assert.equal(new Set(ids).size, 15, 'cviky se v blocích neopakují')
  assert.match(m[0].structure, /3 opakování, 3 série/)
  assert.match(m[0].structure, /Potom pauza 2 min/)
  assert.doesNotMatch(m[2].structure, /Potom pauza/)
})

test('klasický okruh se zadaným počtem 15 stanovišť a intervalem 30/10', () => {
  const w = gen({ params: { blocks: 1, perBlock: 15, rounds: 1, workSec: 30, restSec: 10 } })
  const m = mains(w)
  assert.equal(m.length, 1)
  assert.equal(m[0].exercises.length, 15)
  assert.equal(m[0].label, undefined)
  assert.equal(m[0].minutes, 10) // 15 × 40 s
  assert.match(m[0].structure, /Okruh \(15 stanic\): 30 s práce \/ 10 s přechod/)
  assert.ok(m[0].exercises.every((e) => !e.valueText))
})

test('TRX: bloky po 3 cvicích (40/20) s pauzou na pití mezi bloky', () => {
  const w = gen({ format: 'TRX', equipment: ['TRX'], params: { blocks: 4, perBlock: 3, rounds: 3, workSec: 40, restSec: 20, pauseSec: 30, pauseBlocksSec: 120 } })
  const m = mains(w)
  assert.equal(m.length, 4)
  assert.ok(m.every((b) => b.exercises.length === 3))
  assert.ok(m.every((b) => b.minutes === 10)) // 3 × 3 × 60 s + 2 × 30 s
  assert.equal(w.totalMinutes, 5 + 40 + 6 + 5)
  const all = m.flatMap((b) => b.exercises)
  assert.equal(new Set(all.map((e) => e.id)).size, 12)
  const byId = new Map(lib.map((e) => [e.id, e]))
  const nonTrx = all.filter((e) => !byId.get(e.id)!.equipment.includes('TRX')).length
  assert.ok(nonTrx <= Math.floor(12 * 0.2), 'v TRX je nejvýše 20 % cviků bez TRX')
})

test('úprava: odebrání cviku změní čas jen toho bloku, změna režimu přepíše opakování', () => {
  let w = gen({ params: { blocks: 3, perBlock: 5, rounds: 3, mode: 'opak', reps: 3, pauseSec: 120, pauseBlocksSec: 120 } })
  const idx = w.blocks.findIndex((b) => b.label === 'Blok B')
  const before = mains(w).map((b) => b.minutes)
  w = removeExercise(w, idx, 0)
  const after = mains(w).map((b) => b.minutes)
  assert.equal(after[0], before[0]); assert.equal(after[2], before[2])
  assert.ok(after[1] < before[1])
  w = setParams(w, { reps: 5 })
  assert.ok(mains(w).every((b) => b.exercises.every((e) => e.valueText === '5×')))
  w = setParams(w, { mode: 'cas', workSec: 40, restSec: 20 })
  assert.ok(mains(w).every((b) => b.exercises.every((e) => !e.valueText)))
  assert.match(mains(w)[0].structure, /40 s práce \/ 20 s přechod/)
})

test('nová struktura i starší tréninky bez nových polí projdou kontrolou před exportem', () => {
  const w = gen({ params: { blocks: 3, perBlock: 5, rounds: 3, mode: 'opak', reps: 3, pauseSec: 120 } })
  assert.ok(workoutSchema.safeParse(JSON.parse(JSON.stringify(w))).success)
  const legacy = JSON.parse(JSON.stringify(gen({}))); legacy.params = { workSec: 40, restSec: 20, rounds: 3, pauseSec: 60 }
  assert.ok(workoutSchema.safeParse(legacy).success)
  // starší trénink se po úpravě přepočítá s výchozími hodnotami
  const upd = setParams(legacy as GeneratedWorkout, { rounds: 2 })
  assert.equal(upd.params.blocks, 1); assert.equal(upd.params.mode, 'cas')
})

test('nadpisy bloků pro tisk a souhrn', () => {
  assert.equal(blockHeading({ key: 'hlavní', label: 'Blok A', minutes: 7 }), 'Blok A – 7 min')
  assert.equal(blockHeading({ key: 'hlavní', label: 'AMRAP 20 min', minutes: 20 }), 'Hlavní část: AMRAP 20 min')
  assert.equal(blockHeading({ key: 'rozcvička', minutes: 5 }), 'Rozcvička – 5 min')
  assert.equal(blockSummary({ key: 'hlavní', label: 'Blok B', minutes: 7 }), 'Blok B 7 min')
})

test('nedostatek cviků pro velký počet stanovišť vrací upozornění, ne chybu', () => {
  const r = generateWorkout(lib, { ...base, level: 'začátečník', equipment: [], params: { blocks: 3, perBlock: 20 } })
  assert.ok(r.ok)
  if (r.ok) assert.ok(r.workout.warnings.length > 0 || mains(r.workout).flatMap((b) => b.exercises).length === 60)
})
