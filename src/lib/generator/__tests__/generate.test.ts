import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as XLSX from 'xlsx'
import type { Exercise } from '@/lib/constants'
import { generateWorkout } from '../generate'
import { mulberry32 } from '../rng'
import type { GeneratorInput, Level } from '../types'

const list = (v: unknown) => String(v ?? '').split(',').map((s) => s.trim()).filter(Boolean)
const wb = XLSX.readFile('docs/cviky_import.xlsx')
const lib: Exercise[] = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets['Cviky']).map((r, i) => ({
  id: `ex${i}`, name: r.nazev, alt_name: r.alternativni_nazev ?? null, muscle: r.partie, level: r.uroven,
  equipment: list(r.pomucky).filter((x) => x !== 'vlastní váha'), environment: r.prostredi, formats: list(r.formaty),
  blocks: list(r.bloky), cardio_strength: Number(r.kardio_sila), movement: r.pohybovy_vzorec,
  default_value: r.vychozi_hodnota ?? null, unit: r.jednotka ?? 'opakování', description: r.popis, video_url: r.video_url ?? null, active: true,
}))
const byName = new Map(lib.map((e) => [e.name, e]))
const ALL_EQ = [...new Set(lib.flatMap((e) => e.equipment))]
const rank = (l: string) => ['začátečník', 'pokročilý', 'expert'].indexOf(l)

const base: GeneratorInput = {
  level: 'pokročilý', muscles: [], equipment: ALL_EQ, environment: 'uvnitř', format: 'Tabata',
  warmupMin: 5, mainMin: 20, cooldownMin: 5, cardioStrength: 3, seed: 1,
}
const gen = (o: Partial<GeneratorInput>) => generateWorkout(lib, { ...base, ...o })

test('knihovna se načetla', () => assert.ok(lib.length >= 147))

test('počty cviků podle šablon (PRD kap. 7)', () => {
  const count = (o: Partial<GeneratorInput>) => {
    const r = gen(o); assert.ok(r.ok); return r.workout.blocks.find((b) => b.key === 'hlavní')!.exercises.length
  }
  assert.equal(count({ format: 'Tabata', mainMin: 20 }), 4)
  assert.equal(count({ format: 'TRX', mainMin: 20 }), 6)
  assert.equal(count({ format: 'CrossFit', subtype: 'AMRAP', mainMin: 12 }), 3)
  assert.equal(count({ format: 'CrossFit', subtype: 'EMOM', mainMin: 12 }), 4)
  assert.equal(count({ format: 'CrossFit', subtype: 'For Time', mainMin: 15 }), 5)
})

test('tvrdá pravidla na 300 náhodných zadání', () => {
  const rng = mulberry32(42)
  const pick = <T,>(a: T[]) => a[Math.floor(rng() * a.length)]
  let errors = 0, warned = 0
  for (let i = 0; i < 300; i++) {
    const format = pick(['Tabata', 'TRX', 'CrossFit'] as const)
    const eq = ALL_EQ.filter(() => rng() < 0.6)
    if (format === 'TRX' && !eq.includes('TRX')) eq.push('TRX')
    const input: GeneratorInput = {
      level: pick<Level>(['začátečník', 'pokročilý', 'expert']), environment: pick(['uvnitř', 'venku'] as const),
      muscles: ['nohy', 'záda', 'core', 'hrudník', 'ramena', 'paže'].filter(() => rng() < 0.3),
      equipment: eq, format, subtype: format === 'CrossFit' ? pick(['AMRAP', 'EMOM', 'For Time'] as const) : undefined,
      warmupMin: pick([0, 3, 5, 8]), mainMin: pick([8, 12, 16, 20, 30]), cooldownMin: pick([0, 3, 5]),
      cardioStrength: 1 + Math.floor(rng() * 5), seed: i + 1000,
    }
    const r = generateWorkout(lib, input)
    if (!r.ok) { errors++; assert.ok(r.error.length > 10); continue }
    if (r.workout.warnings.length) warned++
    const seen = new Set<string>()
    for (const b of r.workout.blocks) for (const w of b.exercises) {
      const e = byName.get(w.name)!
      assert.ok(!seen.has(e.name), `duplicita ${e.name}`); seen.add(e.name)
      assert.ok(e.equipment.every((x) => input.equipment.includes(x)), `pomůcka ${e.name}`)
      assert.ok(e.environment === 'obojí' || e.environment === input.environment, `prostředí ${e.name}`)
      assert.ok(rank(e.level) <= rank(input.level), `úroveň ${e.name}`)
      if (b.key === 'hlavní') assert.ok(rank(e.level) >= rank(input.level) - 1, `úroveň (hlavní) ${e.name}`)
      assert.ok(e.blocks.includes(b.key), `blok ${e.name}`)
      if (b.key === 'hlavní') assert.ok(e.formats.includes(input.format), `formát ${e.name}`)
      if (b.key === 'rozcvička') assert.ok(e.cardio_strength <= 3 && e.level !== 'expert', `rozcvička ${e.name}`)
      if (b.key === 'zklidnění') assert.ok(e.cardio_strength === 2 && e.movement !== 'skok' && e.level !== 'expert', `zklidnění ${e.name}`)
    }
    if (format === 'TRX') {
      const main = r.workout.blocks.find((b) => b.key === 'hlavní')!.exercises.map((w) => byName.get(w.name)!)
      assert.ok(main.every((e) => e.equipment.includes('TRX') || e.equipment.length === 0))
      assert.ok(main.filter((e) => !e.equipment.includes('TRX')).length <= Math.floor(main.length * 0.2))
    }
  }
  console.log(`  chyb (srozumitelných): ${errors}/300, s upozorněním: ${warned}/300`)
})

test('TRX bez pomůcky TRX vrací srozumitelnou chybu', () => {
  const r = gen({ format: 'TRX', equipment: ['kettlebell'] })
  assert.equal(r.ok, false)
})

test('nesplnitelné zadání nikdy nevrátí tichý prázdný výsledek', () => {
  const r = gen({ format: 'CrossFit', subtype: 'AMRAP', level: 'začátečník', equipment: [], environment: 'venku', muscles: ['hrudník'] })
  if (r.ok) assert.ok(r.workout.blocks[1].exercises.length > 0)
  else assert.ok(r.error.length > 10)
})

test('různé seedy dávají různé sestavy', () => {
  const a = gen({ seed: 1 }), b = gen({ seed: 2 })
  assert.ok(a.ok && b.ok)
  const names = (r: typeof a) => (r.ok ? r.workout.blocks.flatMap((x) => x.exercises.map((e) => e.name)).join('|') : '')
  assert.notEqual(names(a), names(b))
})

test('vybrané partie mají přednost', () => {
  const r = gen({ muscles: ['záda'], format: 'CrossFit', subtype: 'AMRAP', mainMin: 16, seed: 7 })
  assert.ok(r.ok)
  const main = r.workout.blocks.find((b) => b.key === 'hlavní')!.exercises
  assert.ok(main.filter((e) => e.muscle === 'záda').length >= 2)
})

test('CrossFit: kombinace AMRAP 20 + EMOM 10 jako dvě části bez opakování cviků', () => {
  const r = gen({ format: 'CrossFit', segments: [{ type: 'AMRAP', minutes: 20 }, { type: 'EMOM', minutes: 10 }], warmupMin: 5, cooldownMin: 5, equipment: ['činky', 'kettlebell', 'bedna', 'osa', 'hrazda', 'švihadlo', 'medicinbal'], level: 'pokročilý' })
  assert.ok(r.ok)
  const parts = r.workout.blocks.filter((b) => b.key === 'hlavní')
  assert.equal(parts.length, 2)
  assert.equal(parts[0].label, 'AMRAP 20 min'); assert.equal(parts[1].label, 'EMOM 10 min')
  assert.equal(parts[0].exercises.length, 5); assert.equal(parts[1].exercises.length, 2)
  assert.equal(r.workout.totalMinutes, 40)
  assert.ok(parts[1].exercises.every((e) => e.note?.startsWith('minuty')))
  const names = r.workout.blocks.flatMap((b) => b.exercises.map((e) => e.name))
  assert.equal(new Set(names).size, names.length)
  assert.match(r.workout.title, /AMRAP \+ EMOM/)
})

test('CrossFit: pomůcky se neuvádějí, pokud nejsou zvolené (kruhy, sáně, GHD)', () => {
  const r = gen({ format: 'CrossFit', segments: [{ type: 'For Time', minutes: 12 }], equipment: ['činky'], level: 'pokročilý' })
  assert.ok(r.ok)
  const used = r.workout.blocks.flatMap((b) => b.exercises.flatMap((e) => e.equipment))
  assert.ok(used.every((x) => x === 'činky'))
})

test('CrossFit nikdy nevybere cvik s pomůckou TRX, bosu, lano, roller ani stepper', () => {
  const banned = ['TRX', 'bosu', 'lano', 'roller', 'stepper']
  const eq = ALL_EQ.filter((x) => !banned.includes(x))
  for (let i = 0; i < 40; i++) {
    const r = gen({ format: 'CrossFit', segments: [{ type: 'AMRAP', minutes: 15 }, { type: 'EMOM', minutes: 8 }], equipment: eq, seed: 500 + i, level: 'expert' })
    assert.ok(r.ok)
    for (const b of r.workout.blocks) for (const e of b.exercises) assert.ok(!e.equipment.some((x) => banned.includes(x)), e.name)
  }
})
