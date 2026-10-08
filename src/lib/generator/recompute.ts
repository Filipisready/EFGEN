import { cviku, fmtSec, mainStructure, totalMainSeconds } from './templates'
import type { GeneratedWorkout } from './types'

const round1 = (n: number) => Math.round(n * 10) / 10

/**
 * Přepočítá časy a popisy struktury po jakékoli změně (PRD FR-35).
 * Tabata a TRX: délka hlavní části vyplývá z počtu cviků a parametrů šablony.
 * CrossFit: délka části je zadaná, mění se jen rozpis (EMOM minuty).
 */
export function recompute(w: GeneratedWorkout): GeneratedWorkout {
  const blocks = w.blocks.map((b) => {
    const n = b.exercises.length
    if (b.key === 'hlavní') {
      const derived = w.format === 'Tabata' || w.format === 'TRX'
      const minutes = derived ? (n ? round1(totalMainSeconds(w.format, undefined, 0, n, w.params) / 60) : 0) : b.minutes
      const exercises = b.exercises.map((e, i) => {
        if (b.type !== 'EMOM' || !n) return { ...e, note: undefined }
        const mins: number[] = []
        for (let m = 1; m <= minutes; m++) if ((m - 1) % n === i) mins.push(m)
        return { ...e, note: `minuty ${mins.join(', ')}` }
      })
      return {
        ...b, minutes, exercises,
        label: b.type ? `${b.type} ${minutes} min` : b.label,
        structure: n ? mainStructure(w.format, b.type, minutes, n, w.params) : 'bez cviků',
      }
    }
    const per = n ? Math.round((b.minutes * 60) / n) : 0
    return { ...b, structure: n ? `${cviku(n)} po ${fmtSec(per)}` : 'bez cviků' }
  })
  return { ...w, blocks, totalMinutes: round1(blocks.reduce((a, b) => a + b.minutes, 0)) }
}
