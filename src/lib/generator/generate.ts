import type { Exercise } from '@/lib/constants'
import { mulberry32, weightedPick, type Rng } from './rng'
import { cviku, fmtSec, mainCount, mainStructure, resolveParams } from './templates'
import type { BlockKey, GenerateResult, GeneratorInput, WorkoutBlock } from './types'
import { buildPools, context, toWorkoutExercise, type Step } from './pools'
import { familyKey } from './family'
import { recompute } from './recompute'

const DAY = (d = new Date()) => d.toISOString().slice(0, 10)
const LETTERS = 'ABCDEFGHIJKL'

/** Měkká pravidla pořadí (PRD 6.5, pravidla 7 až 11). Vrací násobek váhy kandidáta. */
/** Oblast těla pro střídání stanic v kruhovém tréninku. */
const REGION: Record<string, string> = {
  hrudník: 'horní', 'horní záda': 'horní', ramena: 'horní', biceps: 'horní', triceps: 'horní',
  břicho: 'střed', 'šikmé břicho': 'střed', 'spodní záda': 'střed', hýždě: 'dolní', 'přední stehna': 'dolní', 'zadní stehna': 'dolní', lýtka: 'dolní',
}

function sequenceFactor(prev: Exercise | undefined, cand: Exercise, circuit: boolean): number {
  if (!prev) return 1
  let f = 1
  if (prev.muscle === cand.muscle) f *= circuit ? 0.08 : 0.25
  else if (circuit && REGION[prev.muscle] && REGION[prev.muscle] === REGION[cand.muscle]) f *= 0.5
  if (prev.movement === cand.movement && cand.movement !== 'jiné') f *= 0.3
  if (prev.movement === 'tlak' && cand.movement === 'tlak') f *= 0.2
  if (prev.movement === 'skok' && cand.movement === 'skok') f *= 0.1
  const kb = (n: string) => n.includes('Švih s kettlebellem')
  const dl = (n: string) => n.includes('Mrtvý tah')
  if ((kb(prev.name) && dl(cand.name)) || (dl(prev.name) && kb(cand.name))) f *= 0.1
  if (prev.equipment.includes('hrazda') && cand.equipment.includes('hrazda')) f *= 0.1
  return f
}

function pickSequence(pool: Exercise[], n: number, rng: Rng, opts: {
  targetK?: number
  muscles?: string[] // preferované partie
  circuit?: boolean // kruhový trénink: stanice střídají partie
  groupLevel?: string // cviky vlastní úrovně skupiny mají přednost před o stupeň nižšími
  avoidFamilies?: Set<string> // rodiny cviků, které už v tréninku jsou (jiná pomůcka = tentýž cvik)
  maxFromGroupB?: { isB: (e: Exercise) => boolean; max: number }
}): Exercise[] {
  const chosen: Exercise[] = []
  const covered = new Set<string>()
  let usedB = 0
  const preferred = opts.muscles?.length ? new Set(opts.muscles) : null
  const families = new Set(opts.avoidFamilies ?? [])
  while (chosen.length < n) {
    const open = pool.filter((e) => !chosen.includes(e) && !(opts.maxFromGroupB && opts.maxFromGroupB.isB(e) && usedB >= opts.maxFromGroupB.max))
    // Tentýž cvik s jinou pomůckou se v tréninku neopakuje; jen když by nezbylo nic jiného, připustí se.
    const fresh = open.filter((e) => !families.has(familyKey(e)))
    const cands = fresh.length ? fresh : open
    if (!cands.length) break
    const prev = chosen[chosen.length - 1]
    const allCovered = !preferred || [...preferred].every((m) => covered.has(m))
    const weights = cands.map((e) => {
      let w = 1
      if (opts.groupLevel && e.level !== opts.groupLevel) w *= 0.35
      if (opts.targetK) w *= Math.exp(-0.6 * Math.abs(e.cardio_strength - opts.targetK))
      if (preferred) {
        const hit = preferred.has(e.muscle)
        w *= hit ? 4 : e.muscle === 'celé tělo' ? 1.2 : 0.04
        if (hit && !allCovered && !covered.has(e.muscle)) w *= 3
      }
      return w * sequenceFactor(prev, e, !!opts.circuit)
    })
    const pick = weightedPick(cands, weights, rng)
    chosen.push(pick)
    families.add(familyKey(pick))
    covered.add(pick.muscle)
    if (opts.maxFromGroupB?.isB(pick)) usedB++
  }
  return chosen
}

export function generateWorkout(lib: Exercise[], input: GeneratorInput): GenerateResult {
  const rng = mulberry32(input.seed ?? Math.floor(Math.random() * 2 ** 32))
  const warnings: string[] = []
  const params = resolveParams(input.format, input.params)
  const avail = new Set(input.equipment)

  if (input.format !== 'CrossFit' && params.perBlock <= 0 && input.mainMin < 1) return { ok: false, error: 'Zadejte délku hlavní části (alespoň 1 minutu).' }
  if (input.format === 'TRX' && !avail.has('TRX')) return { ok: false, error: 'Pro formát TRX zaškrtněte mezi pomůckami TRX.' }

  const pools = buildPools(lib, input)
  const diag: Step[] = pools.diag

  // Hlavní část: u CrossFitu může mít několik částí (např. AMRAP 20 min + EMOM 10 min).
  const segments = input.format === 'CrossFit'
    ? (input.segments?.length ? input.segments : [{ type: input.subtype ?? 'AMRAP', minutes: input.mainMin }])
    : [{ type: undefined, minutes: input.mainMin }]
  if (input.format === 'CrossFit' && segments.some((sg) => !(sg.minutes >= 1))) return { ok: false, error: 'Zadejte délku hlavní části (alespoň 1 minutu).' }

  const mainPool = pools.main
  const trx = input.format === 'TRX'
  if (!mainPool.length) return { ok: false, error: explain(input, diag) }

  const mainBlocks: WorkoutBlock[] = []
  const allMain: Exercise[] = []
  if (input.format !== 'CrossFit') {
    // Kruhový trénink a TRX: bloky A, B, C… o stejném počtu cviků, každý v sériích. Klasický okruh je jeden blok.
    const perBlock = mainCount(input.format, undefined, input.mainMin, params)
    const nBlocks = Math.max(1, params.blocks)
    const total = perBlock * nBlocks
    const groupB = trx ? { isB: (e: Exercise) => !e.equipment.includes('TRX'), max: Math.floor(total * 0.2) } : undefined
    const ex = pickSequence(mainPool, total, rng, {
      targetK: input.cardioStrength, muscles: input.muscles, circuit: input.format === 'Kruhový trénink', maxFromGroupB: groupB, groupLevel: input.level,
    })
    allMain.push(...ex)
    if (ex.length < total) warnings.push(`V knihovně je jen ${ex.length} vhodných cviků z požadovaných ${total}. ${explain(input, diag)}`)
    for (let i = 0; i < nBlocks; i++) {
      const part = ex.slice(i * perBlock, (i + 1) * perBlock)
      if (!part.length) break
      mainBlocks.push({
        key: 'hlavní', minutes: 0, structure: '', label: nBlocks > 1 ? `Blok ${LETTERS[i]}` : undefined,
        exercises: part.map((e) => toWorkoutExercise(e, false)),
      })
    }
  } else {
    for (const sg of segments) {
      const n = mainCount(input.format, sg.type, sg.minutes, params)
      const pool = mainPool.filter((e) => !allMain.includes(e))
      const ex = pickSequence(pool, n, rng, {
        targetK: input.cardioStrength, muscles: input.muscles, groupLevel: input.level, avoidFamilies: new Set(allMain.map(familyKey)),
      })
      allMain.push(...ex)
      const label = sg.type ? `${sg.type} ${sg.minutes} min` : undefined
      if (ex.length < n) {
        warnings.push(`${label ? label + ': ' : ''}v knihovně je jen ${ex.length} vhodných cviků z doporučených ${n}. ${explain(input, diag)}`)
      }
      mainBlocks.push({
        key: 'hlavní', minutes: sg.minutes, label, type: sg.type,
        structure: mainStructure(sg.type, sg.minutes, ex.length, params),
        exercises: ex.map((e, i) => {
          const w = toWorkoutExercise(e, true)
          if (sg.type === 'EMOM') {
            const mins: number[] = []
            for (let m = 1; m <= sg.minutes; m++) if ((m - 1) % ex.length === i) mins.push(m)
            w.note = `minuty ${mins.join(', ')}`
          }
          return w
        }),
      })
    }
  }
  const mainEx = allMain

  // Rozcvička (pravidlo 5) a zklidnění (pravidlo 6)
  const blocks: WorkoutBlock[] = []
  const mainMuscles = [...new Set(mainEx.map((e) => e.muscle).filter((m) => m !== 'celé tělo'))]

  if (input.warmupMin > 0) {
    const pool = pools.warm.filter((e) => !mainEx.includes(e))
    const k = input.warmupMin
    const sel = pickSequence(pool, k, rng, { muscles: input.muscles.length ? input.muscles : mainMuscles, avoidFamilies: new Set(mainEx.map(familyKey)) })
    if (sel.length < k) warnings.push(`Rozcvička: vhodných cviků je jen ${sel.length} z ${k}.`)
    const ordered = [...sel.filter((e) => e.muscle === 'celé tělo'), ...sel.filter((e) => e.muscle !== 'celé tělo')]
    blocks.push(block('rozcvička', input.warmupMin, ordered))
  }
  blocks.push(...mainBlocks)
  if (input.cooldownMin > 0) {
    const usedWarm = new Set(blocks.flatMap((b) => b.exercises.map((x) => x.id)))
    const pool = pools.cool.filter((e) => !mainEx.includes(e) && !usedWarm.has(e.id))
    const k = input.cooldownMin
    const used = new Set([...mainEx, ...blocks.flatMap((b) => b.exercises.map((x) => lib.find((l) => l.id === x.id)!).filter(Boolean))].map(familyKey))
    const sel = pickSequence(pool, k, rng, { muscles: mainMuscles, avoidFamilies: used })
    if (sel.length < k) warnings.push(`Zklidnění: vhodných cviků je jen ${sel.length} z ${k}.`)
    blocks.push(block('zklidnění', input.cooldownMin, sel))
  }

  const total = Math.round(blocks.reduce((a, b) => a + b.minutes, 0) * 10) / 10
  const label = input.format === 'CrossFit' ? `CrossFit ${[...new Set(segments.map((x) => x.type))].join(' + ')}` : input.format
  return {
    ok: true,
    workout: recompute({
      title: input.title?.trim() || `${label} ${new Date().toLocaleDateString('cs-CZ')}`,
      date: DAY(), groupName: input.groupName?.trim() || undefined, groupSize: input.groupSize,
      format: input.format, subtype: input.format === 'CrossFit' && segments.length === 1 ? segments[0].type : undefined,
      totalMinutes: total, blocks, params, warnings, context: context(input),
    }),
  }
}

function block(key: BlockKey, minutes: number, ex: Exercise[]): WorkoutBlock {
  const per = ex.length ? Math.round((minutes * 60) / ex.length) : 0
  return {
    key, minutes,
    structure: ex.length ? `${cviku(ex.length)} po ${fmtSec(per)}` : 'bez cviků',
    exercises: ex.map((e) => toWorkoutExercise(e, false)),
  }
}

function explain(input: GeneratorInput, diag: Step[]) {
  const last = diag[diag.length - 1]
  const worst = diag.reduce((a, b, i, arr) => (i > 0 && arr[i - 1].count - b.count > a.drop ? { drop: arr[i - 1].count - b.count, label: b.label } : a), { drop: 0, label: '' })
  return `Zbylo ${last.count} cviků ${last.label}. Nejvíc jich vypadlo u filtru „${worst.label}“. Zkuste přidat pomůcky, změnit prostředí, úroveň nebo formát.`
}
