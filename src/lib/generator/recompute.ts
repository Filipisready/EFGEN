import { blockSeconds, circuitText, cviku, fmtSec, mainStructure, resolveParams } from './templates'
import type { GeneratedWorkout } from './types'

const round1 = (n: number) => Math.round(n * 10) / 10

/**
 * Přepočítá časy a popisy struktury po jakékoli změně (PRD FR-35).
 * Kruhový trénink a TRX: délka každého bloku vyplývá z počtu cviků a parametrů (interval, série, pauzy),
 * celkový čas navíc zahrnuje pauzy mezi bloky.
 * CrossFit: délka části je zadaná, mění se jen rozpis (EMOM minuty).
 */
export function recompute(w: GeneratedWorkout): GeneratedWorkout {
  const p = resolveParams(w.format, w.params)
  const circuit = w.format !== 'CrossFit'
  const mainIdx = w.blocks.flatMap((b, i) => (b.key === 'hlavní' ? [i] : []))
  const lastMain = mainIdx[mainIdx.length - 1]

  const blocks = w.blocks.map((b, bi) => {
    const n = b.exercises.length
    if (b.key === 'hlavní' && circuit) {
      const exercises = b.exercises.map((e) => ({ ...e, note: undefined, valueText: p.mode === 'opak' ? `${p.reps}×` : undefined }))
      const pause = bi !== lastMain && p.pauseBlocksSec > 0 ? ` Potom pauza ${fmtSec(p.pauseBlocksSec)}.` : ''
      return {
        ...b, exercises,
        minutes: n ? round1(blockSeconds(p, n) / 60) : 0,
        structure: n ? circuitText(p, n) + pause : 'bez cviků',
      }
    }
    if (b.key === 'hlavní') {
      const exercises = b.exercises.map((e, i) => {
        if (b.type !== 'EMOM' || !n) return { ...e, note: undefined }
        const mins: number[] = []
        for (let m = 1; m <= b.minutes; m++) if ((m - 1) % n === i) mins.push(m)
        return { ...e, note: `minuty ${mins.join(', ')}` }
      })
      return {
        ...b, exercises,
        label: b.type ? `${b.type} ${b.minutes} min` : b.label,
        structure: n ? mainStructure(b.type, b.minutes, n, p) : 'bez cviků',
      }
    }
    const per = n ? Math.round((b.minutes * 60) / n) : 0
    return { ...b, structure: n ? `${cviku(n)} po ${fmtSec(per)}` : 'bez cviků' }
  })
  const pauses = circuit ? Math.max(0, mainIdx.length - 1) * (p.pauseBlocksSec / 60) : 0
  return { ...w, params: p, blocks, totalMinutes: round1(blocks.reduce((a, b) => a + b.minutes, 0) + pauses) }
}
