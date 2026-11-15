import type { Format, Mode, Subtype, TemplateParams } from './types'

export type ResolvedParams = Required<TemplateParams>

const CIRCUIT_DEFAULTS: ResolvedParams = {
  workSec: 40, restSec: 20, rounds: 3, pauseSec: 60,
  blocks: 1, perBlock: 0, mode: 'cas' as Mode, reps: 3, restBetweenSec: 0, pauseBlocksSec: 120,
}
export const DEFAULT_PARAMS: Record<Format, ResolvedParams> = {
  'Kruhový trénink': CIRCUIT_DEFAULTS,
  TRX: CIRCUIT_DEFAULTS,
  CrossFit: { ...CIRCUIT_DEFAULTS, workSec: 0, restSec: 0, pauseSec: 0, pauseBlocksSec: 0 },
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Doplní chybějící hodnoty výchozími (starší uložené tréninky nemají nová pole). */
export function resolveParams(format: Format, p?: TemplateParams): ResolvedParams {
  const out = { ...DEFAULT_PARAMS[format] } as Record<string, unknown>
  for (const [k, v] of Object.entries(p ?? {})) if (v !== undefined && v !== null) out[k] = v
  return out as ResolvedParams
}

/** Odhad času jednoho opakování (sekundy) při režimu na opakování. */
export const SEC_PER_REP = 4

/** Čas jednoho cviku včetně přechodu (sekundy). */
const exerciseSec = (p: ResolvedParams) => (p.mode === 'opak' ? p.reps * SEC_PER_REP + p.restBetweenSec : p.workSec + p.restSec)

/** Délka jednoho bloku o n cvicích ve všech sériích (sekundy). Pauza mezi bloky se nepočítá. */
export const blockSeconds = (p: ResolvedParams, n: number) => n * p.rounds * exerciseSec(p) + Math.max(0, p.rounds - 1) * p.pauseSec

/** Celková délka hlavní části: bloky plus pauzy mezi nimi (sekundy). */
export const circuitSeconds = (p: ResolvedParams, perBlock: number, blocks = p.blocks) =>
  blocks * blockSeconds(p, perBlock) + Math.max(0, blocks - 1) * p.pauseBlocksSec

/** Kolik cviků v jednom okruhu se vejde do dané délky (bez omezení, jen alespoň 1). */
export const stationsForMinutes = (p: ResolvedParams, minutes: number) =>
  Math.max(1, Math.floor((minutes * 60 - Math.max(0, p.rounds - 1) * p.pauseSec) / (p.rounds * exerciseSec(p))))

/** Počet cviků hlavní části podle PRD kap. 7. */
export function mainCount(format: Format, subtype: Subtype | undefined, mainMin: number, p: ResolvedParams) {
  if (format !== 'CrossFit') return p.perBlock > 0 ? p.perBlock : clamp(stationsForMinutes(p, mainMin), 4, 10)
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

/** Popis časové struktury části CrossFitu. */
export function mainStructure(subtype: Subtype | undefined, mainMin: number, n: number, p: ResolvedParams) {
  if (subtype === 'EMOM') return `EMOM ${mainMin} min: každou minutu jeden cvik, ${cviku(n)} se střídají`
  if (subtype === 'For Time') return `For Time: ${p.rounds}× dokola všechny cviky co nejrychleji, časový limit ${mainMin} min`
  return `AMRAP ${mainMin} min: co nejvíc kol všech cviků za časový limit`
}

/** Popis jednoho bloku kruhového tréninku nebo TRX čitelný pro člověka. */
export function circuitText(p: ResolvedParams, n: number): string {
  if (n === 0) return 'bez cviků'
  const lead = p.blocks === 1 && p.mode === 'cas' ? `Okruh (${stanic(n)}): ` : `${cviku(n)}: `
  const interval = p.mode === 'opak'
    ? `${p.reps} opakování${p.restBetweenSec ? `, pauza mezi cviky ${fmtSec(p.restBetweenSec)}` : ''}`
    : `${p.workSec} s práce / ${p.restSec} s přechod`
  const rounds = p.mode === 'opak' ? serie(p.rounds) : `${p.rounds}× dokola`
  const pause = p.rounds > 1 && p.pauseSec > 0 ? `, mezi ${p.mode === 'opak' ? 'sériemi' : 'koly'} pauza ${fmtSec(p.pauseSec)}` : ''
  return `${lead}${interval}, ${rounds}${pause}${p.mode === 'opak' ? ' (čas je odhad)' : ''}`
}

/** Číslovka + správný tvar slova „cvik“. */
export const cviku = (n: number) => `${n} ${n === 1 ? 'cvik' : n >= 2 && n <= 4 ? 'cviky' : 'cviků'}`
/** Číslovka + správný tvar slova „série“. */
export const serie = (n: number) => `${n} ${n === 1 ? 'série' : n >= 2 && n <= 4 ? 'série' : 'sérií'}`
const stanic = (n: number) => `${n} ${n === 1 ? 'stanice' : n >= 2 && n <= 4 ? 'stanice' : 'stanic'}`
