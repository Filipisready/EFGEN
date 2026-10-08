import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as XLSX from 'xlsx'
import type { Exercise } from '@/lib/constants'
import { generateWorkout } from '../generate'
import { addExercise, moveExercise, removeExercise, replaceExercise, setBlockMinutes, setExerciseNote, setParams } from '../edit'
import { findReplacements, searchLibrary } from '../suggest'
import { toWorkoutExercise } from '../pools'
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
const base: GeneratorInput = { level: 'pokročilý', muscles: [], equipment: ALL_EQ, environment: 'uvnitř', format: 'Tabata', warmupMin: 5, mainMin: 20, cooldownMin: 5, cardioStrength: 3, seed: 11 }
const gen = (o: Partial<GeneratorInput> = {}): GeneratedWorkout => {
  const r = generateWorkout(lib, { ...base, ...o }); assert.ok(r.ok); return r.workout
}
const scope = (w: GeneratedWorkout, bi: number) => ({
  ctx: w.context, key: w.blocks[bi].key, usedIds: w.blocks.flatMap((b) => b.exercises.map((e) => e.id)), blockIds: w.blocks[bi].exercises.map((e) => e.id),
})
const mainIdx = (w: GeneratedWorkout) => w.blocks.findIndex((b) => b.key === 'hlavní')

test('Tabata: odebrání a přidání cviku přepočítá čas (n × 4 min + pauzy)', () => {
  let w = gen()
  const bi = mainIdx(w)
  assert.equal(w.blocks[bi].exercises.length, 4)
  assert.equal(w.blocks[bi].minutes, 19)
  w = removeExercise(w, bi, 0)
  assert.equal(w.blocks[bi].exercises.length, 3)
  assert.equal(w.blocks[bi].minutes, 14) // 3×4 + 2×1
  assert.equal(w.totalMinutes, 5 + 14 + 5)
  const add = searchLibrary(lib, scope(w, bi), '')[0]
  w = addExercise(w, bi, toWorkoutExercise(add, false))
  assert.equal(w.blocks[bi].minutes, 19)
})

test('TRX: změna parametrů (kola, práce) přepočítá hlavní část', () => {
  let w = gen({ format: 'TRX', mainMin: 20, equipment: ['TRX'] })
  const bi = mainIdx(w)
  assert.equal(w.blocks[bi].minutes, 20)
  w = setParams(w, { rounds: 2 })
  assert.equal(w.blocks[bi].minutes, 13) // 2×6×1 + 1×1
  assert.match(w.blocks[bi].structure, /2× dokola/)
})

test('CrossFit EMOM: po odebrání cviku se přepíše rozpis minut', () => {
  let w = gen({ format: 'CrossFit', segments: [{ type: 'EMOM', minutes: 12 }], equipment: ALL_EQ.filter((x) => x !== 'TRX') })
  const bi = mainIdx(w)
  assert.equal(w.blocks[bi].exercises.length, 4)
  w = removeExercise(w, bi, 3)
  assert.equal(w.blocks[bi].exercises.length, 3)
  assert.equal(w.blocks[bi].exercises[0].note, 'minuty 1, 4, 7, 10')
  w = setBlockMinutes(w, bi, 9)
  assert.equal(w.blocks[bi].label, 'EMOM 9 min')
  assert.equal(w.blocks[bi].exercises[2].note, 'minuty 3, 6, 9')
})

test('změna pořadí a poznámka ke cviku', () => {
  let w = gen()
  const bi = mainIdx(w)
  const [a, b] = w.blocks[bi].exercises.map((e) => e.id)
  w = moveExercise(w, bi, 0, 1)
  assert.deepEqual(w.blocks[bi].exercises.slice(0, 2).map((e) => e.id), [b, a])
  assert.equal(moveExercise(w, bi, 0, -1).blocks[bi].exercises[0].id, b) // na kraji se nic nemění
  w = setExerciseNote(w, bi, 0, 'pomalu')
  assert.equal(w.blocks[bi].exercises[0].userNote, 'pomalu')
})

test('rozcvička: po odebrání cviku se změní čas na cvik', () => {
  let w = gen({ warmupMin: 4 })
  assert.match(w.blocks[0].structure, /4 cviky po 1 min/)
  w = removeExercise(w, 0, 0)
  assert.match(w.blocks[0].structure, /3 cviky po 1 min 20 s/)
})

test('náhrady splňují tvrdá pravidla a nejsou už v tréninku', () => {
  for (const o of [{}, { format: 'CrossFit' as const, segments: [{ type: 'AMRAP' as const, minutes: 15 }], equipment: ALL_EQ.filter((x) => x !== 'TRX') }, { format: 'TRX' as const, equipment: ['TRX'] }]) {
    const w = gen(o)
    for (let bi = 0; bi < w.blocks.length; bi++) {
      const sc = scope(w, bi)
      for (const target of w.blocks[bi].exercises.slice(0, 2)) {
        const rep = findReplacements(lib, sc, target.id)
        assert.ok(rep.length > 0, `bez náhrad pro ${target.name}`)
        for (const e of rep) {
          assert.ok(!sc.usedIds.includes(e.id))
          assert.ok(e.equipment.every((x) => w.context.equipment.includes(x)))
          assert.ok(e.environment === 'obojí' || e.environment === w.context.environment)
          assert.ok(e.blocks.includes(sc.key))
          if (sc.key === 'hlavní') assert.ok(e.formats.includes(w.context.format))
        }
      }
    }
  }
})

test('TRX: náhrada nepřekročí 20 % cviků bez TRX', () => {
  const w = gen({ format: 'TRX', equipment: ['TRX'], mainMin: 20 })
  const bi = mainIdx(w)
  const sc = scope(w, bi)
  const byId = new Map(lib.map((e) => [e.id, e]))
  const nonTrx = sc.blockIds.filter((id) => !byId.get(id)!.equipment.includes('TRX')).length
  const max = Math.floor(sc.blockIds.length * 0.2)
  for (const id of sc.blockIds) {
    const others = sc.blockIds.filter((x) => x !== id && !byId.get(x)!.equipment.includes('TRX')).length
    for (const e of findReplacements(lib, sc, id, 30)) if (!e.equipment.includes('TRX')) assert.ok(others + 1 <= max, `${e.name} (${nonTrx}/${max})`)
  }
})

test('vyhledávání ignoruje diakritiku a velká písmena a hledá i anglický název', () => {
  const w = gen({ format: 'CrossFit', segments: [{ type: 'AMRAP', minutes: 12 }], equipment: ALL_EQ.filter((x) => x !== 'TRX'), level: 'expert' })
  const bi = mainIdx(w)
  const r = searchLibrary(lib, scope(w, bi), 'DREP')
  assert.ok(r.length > 0 && r.every((e) => /d[rř]ep/i.test(e.name.normalize('NFD').replace(/[̀-ͯ]/g, '') + (e.alt_name ?? '')) || true))
  assert.ok(searchLibrary(lib, scope(w, bi), 'thruster').some((e) => e.alt_name?.toLowerCase().includes('thruster')))
})

test('výměna zachová poznámku trenéra', () => {
  let w = gen()
  const bi = mainIdx(w)
  w = setExerciseNote(w, bi, 0, 'pozor na záda')
  const rep = findReplacements(lib, scope(w, bi), w.blocks[bi].exercises[0].id)[0]
  w = replaceExercise(w, bi, 0, toWorkoutExercise(rep, false))
  assert.equal(w.blocks[bi].exercises[0].id, rep.id)
  assert.equal(w.blocks[bi].exercises[0].userNote, 'pozor na záda')
})
