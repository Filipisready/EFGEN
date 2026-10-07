import type { Format, Subtype, TemplateParams } from './types'

export const DEFAULT_PARAMS: Record<Format, Required<TemplateParams>> = {
  Tabata: { workSec: 20, restSec: 10, rounds: 8, pauseSec: 60 },
  TRX: { workSec: 40, restSec: 20, rounds: 3, pauseSec: 60 },
  CrossFit: { workSec: 0, restSec: 0, rounds: 3, pauseSec: 0 },
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function resolveParams(format: Format, p?: TemplateParams): Required<TemplateParams> {
  const d = DEFAULT_PARAMS[format]
  return {
    workSec: p?.workSec ?? d.workSec,
    restSec: p?.restSec ?? d.restSec,
    rounds: p?.rounds ?? d.rounds,
    pauseSec: p?.pauseSec ?? d.pauseSec,
  }
}

/** Počet cviků hlavní části podle PRD kap. 7. */
export function mainCount(format: Format, subtype: Subtype | undefined, mainMin: number, p: Required<TemplateParams>) {
  const sec = mainMin * 60
  if (format === 'Tabata') {
    const t = p.rounds * (p.workSec + p.restSec)
    return clamp(Math.floor((sec + p.pauseSec) / (t + p.pauseSec)), 2, 8)
  }
  if (format === 'TRX') {
    const s = p.workSec + p.restSec
    return clamp(Math.floor((sec - (p.rounds - 1) * p.pauseSec) / (p.rounds * s)), 4, 10)
  }
  switch (subtype) {
    case 'EMOM':
      return [4, 3, 2].find((d) => mainMin % d === 0) ?? 2
    case 'For Time':
      return clamp(Math.round(mainMin / 3), 3, 6)
    default:
      return clamp(Math.round(mainMin / 4), 3, 6)
  }
}

export const fmtSec = (s: number) => (s >= 60 && s % 60 === 0 ? `${s / 60} min` : s > 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`)

export function mainStructure(format: Format, subtype: Subtype | undefined, mainMin: number, n: number, p: Required<TemplateParams>) {
  if (format === 'Tabata') {
    return `${p.workSec} s práce / ${p.restSec} s pauza × ${p.rounds} kol na cvik (${fmtSec(p.rounds * (p.workSec + p.restSec))}), mezi cviky pauza ${fmtSec(p.pauseSec)}`
  }
  if (format === 'TRX') {
    return `Okruh (${stanic(n)}): ${p.workSec} s práce / ${p.restSec} s přechod, ${p.rounds}× dokola, mezi koly pauza ${fmtSec(p.pauseSec)}`
  }
  if (subtype === 'EMOM') return `EMOM ${mainMin} min: každou minutu jeden cvik, ${cviku(n)} se střídají`
  if (subtype === 'For Time') return `For Time: ${p.rounds}× dokola všechny cviky co nejrychleji, časový limit ${mainMin} min`
  return `AMRAP ${mainMin} min: co nejvíc kol všech cviků za časový limit`
}

export function totalMainSeconds(format: Format, subtype: Subtype | undefined, mainMin: number, n: number, p: Required<TemplateParams>) {
  if (format === 'Tabata') return n * p.rounds * (p.workSec + p.restSec) + (n - 1) * p.pauseSec
  if (format === 'TRX') return p.rounds * n * (p.workSec + p.restSec) + (p.rounds - 1) * p.pauseSec
  return mainMin * 60
}

/** Číslovka + správný tvar slova „cvik“. */
export const cviku = (n: number) => `${n} ${n === 1 ? 'cvik' : n >= 2 && n <= 4 ? 'cviky' : 'cviků'}`
const stanic = (n: number) => `${n} ${n === 1 ? 'stanice' : n >= 2 && n <= 4 ? 'stanice' : 'stanic'}`
