import type { Format } from './types'

/** Anglický název v závorce se ukazuje jen v CrossFitu a jen když přináší novou informaci. */
export function altLabel(format: Format, name: string, alt?: string | null): string | null {
  if (format !== 'CrossFit' || !alt) return null
  const n = name.toLowerCase(), a = alt.toLowerCase()
  return n === a || n.includes(a) ? null : alt
}

import type { WorkoutBlock } from './types'

const BLOCK_NAMES = { rozcvička: 'Rozcvička', hlavní: 'Hlavní část', zklidnění: 'Zklidnění' } as const

/** Nadpis bloku: „Rozcvička“, „Hlavní část: AMRAP 20 min“, „Blok A“. */
export function blockTitle(b: Pick<WorkoutBlock, 'key' | 'label'>): string {
  if (!b.label) return BLOCK_NAMES[b.key]
  return b.label.startsWith('Blok ') ? b.label : `${BLOCK_NAMES[b.key]}: ${b.label}`
}

/** Krátký popis bloku do souhrnu, např. „Rozcvička 5 min“, „AMRAP 20 min“, „Blok A 7 min“. */
export function blockSummary(b: Pick<WorkoutBlock, 'key' | 'label' | 'minutes'>): string {
  if (!b.label) return `${BLOCK_NAMES[b.key]} ${b.minutes} min`
  return b.label.startsWith('Blok ') ? `${b.label} ${b.minutes} min` : b.label
}

/** Nadpis bloku včetně délky, pro tisk a e-mail: „Rozcvička – 5 min“, „Hlavní část: AMRAP 20 min“, „Blok A – 7 min“. */
export function blockHeading(b: Pick<WorkoutBlock, 'key' | 'label' | 'minutes'>): string {
  if (!b.label) return `${BLOCK_NAMES[b.key]} – ${b.minutes} min`
  return b.label.startsWith('Blok ') ? `${b.label} – ${b.minutes} min` : `${BLOCK_NAMES[b.key]}: ${b.label}`
}

/** Má nadpis bloku zobrazit délku zvlášť (štítek)? U částí CrossFitu je délka součástí názvu. */
export const showsMinutesChip = (b: Pick<WorkoutBlock, 'label'>) => !b.label || b.label.startsWith('Blok ')
