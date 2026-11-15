import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as XLSX from 'xlsx'
import type { Exercise } from '@/lib/constants'
import { generateWorkout } from '../generate'
import { familyKey } from '../family'
import { findReplacements, searchLibrary } from '../suggest'
import { mulberry32 } from '../rng'
import type { GeneratedWorkout, GeneratorInput } from '../types'

const list = (v: unknown) => String(v ?? '').split(',').map((s) => s.trim()).filter(Boolean)
const wb = XLSX.readFile('docs/cviky_import.xlsx')
const lib: Exercise[] = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets['Cviky']).map((r, i) => ({
  id: `ex${i}`, name: r.nazev, alt_name: r.alternativni_nazev ?? null, muscle: r.partie, level: r.uroven,
  equipment: list(r.pomucky).filter((x) => x !== 'vlastní váha'), environment: r.prostredi, formats: list(r.formaty),
  blocks: list(r.bloky), cardio_strength: Number(r.kardio_sila), movement: r.pohybovy_vzorec,
  default_value: r.vychozi_hodnota ?? null, unit: r.jednotka ?? 'opakování', description: r.popis, video_url: r.video_url ?? null, active: true,
}))
const byId = new Map(lib.map((e) => [e.id, e]))
const ALL_EQ = [...new Set(lib.flatMap((e) => e.equipment))]
const base: GeneratorInput = { level: 'pokročilý', muscles: [], equipment: ALL_EQ, environment: 'uvnitř', format: 'Kruhový trénink', warmupMin: 5, mainMin: 20, cooldownMin: 5, cardioStrength: 4, seed: 1 }
const families = (w: GeneratedWorkout) => w.blocks.flatMap((b) => b.exercises.map((e) => familyKey(byId.get(e.id)!)))
const scope = (w: GeneratedWorkout, bi: number) => ({ ctx: w.context, key: w.blocks[bi].key, usedIds: w.blocks.flatMap((b) => b.exercises.map((e) => e.id)), blockIds: w.blocks[bi].exercises.map((e) => e.id) })

test('varianty téhož cviku se stejnou rodinou', () => {
  const k = (n: string) => familyKey(byId.get([...byId.values()].find((e) => e.name === n)!.id)!)
  assert.equal(k('Good morning s osou'), k('Good morning s činkou'))
  assert.equal(k('Dřep s pytlem'), k('Dřep na bosu'))
  assert.equal(k('Zakopávání na míči'), k('Zakopávání s klouzáky'))
  assert.equal(k('Dipy na bradlech'), k('Dipy na kruzích'))
  assert.equal(k('Zdvih činek biceps'), k('TRX biceps'))
  // různé pohyby se nespojují
  assert.notEqual(k('Tlak kettlebellu nad hlavu'), k('Tlak kotouče vpřed'))
  assert.notEqual(k('Mrtvý tah s osou'), k('Rumunský mrtvý tah s činkami'))
  assert.notEqual(k('Prkno'), k('Boční prkno'))
})

test('Good morning s osou a s činkou nikdy spolu (80 různých zadání na spodní záda)', () => {
  for (let seed = 1; seed <= 80; seed++) {
    const r = generateWorkout(lib, { ...base, muscles: ['spodní záda', 'zadní stehna'], seed, params: { blocks: 2, perBlock: 6 } })
    assert.ok(r.ok)
    const names = r.workout.blocks.flatMap((b) => b.exercises.map((e) => e.name))
    assert.ok(!(names.includes('Good morning s osou') && names.includes('Good morning s činkou')), `seed ${seed}`)
  }
})

test('v žádném tréninku není stejná rodina dvakrát (300 náhodných zadání s plnou knihovnou)', () => {
  const rng = mulberry32(99)
  const pick = <T,>(a: T[]) => a[Math.floor(rng() * a.length)]
  for (let i = 0; i < 300; i++) {
    const format = pick(['Kruhový trénink', 'Kruhový trénink', 'CrossFit'] as const)
    const r = generateWorkout(lib, {
      ...base, format, seed: i, level: pick(['začátečník', 'pokročilý', 'expert'] as const), cardioStrength: 1 + Math.floor(rng() * 5),
      muscles: ['hrudník', 'horní záda', 'spodní záda', 'ramena', 'biceps', 'triceps', 'břicho', 'šikmé břicho', 'hýždě', 'přední stehna', 'zadní stehna', 'lýtka'].filter(() => rng() < 0.2),
      equipment: ALL_EQ.filter((x) => x !== 'TRX'),
      segments: format === 'CrossFit' ? [{ type: 'AMRAP', minutes: 16 }, { type: 'EMOM', minutes: 8 }] : undefined,
      params: format === 'CrossFit' ? undefined : pick([{ blocks: 1, perBlock: 12 }, { blocks: 3, perBlock: 5 }, { blocks: 4, perBlock: 3 }]),
    })
    if (!r.ok) continue
    const f = families(r.workout)
    const dup = f.filter((x, j) => f.indexOf(x) !== j)
    assert.equal(dup.length, 0, `seed ${i}: opakovaná rodina ${dup.join(', ')}`)
  }
})

test('výměna a přidání nenabídnou variantu cviku, který v tréninku už je', () => {
  const r = generateWorkout(lib, { ...base, seed: 5, params: { blocks: 1, perBlock: 10 } })
  assert.ok(r.ok)
  const w = r.workout
  const bi = w.blocks.findIndex((b) => b.key === 'hlavní')
  const used = new Set(families(w))
  const target = w.blocks[bi].exercises[0]
  const targetFam = familyKey(byId.get(target.id)!)
  for (const e of findReplacements(lib, scope(w, bi), target.id, 40)) {
    const fam = familyKey(e)
    assert.ok(!used.has(fam) || fam === targetFam, `náhrada ${e.name} je variantou cviku, který v tréninku už je`)
  }
  for (const e of searchLibrary(lib, scope(w, bi), '', 400)) assert.ok(!used.has(familyKey(e)), `přidání ${e.name}`)
})
