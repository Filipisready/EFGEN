import type { Exercise } from '@/lib/constants'

export type Level = 'začátečník' | 'pokročilý' | 'expert'
export type Format = 'Tabata' | 'TRX' | 'CrossFit'
export type Subtype = 'AMRAP' | 'EMOM' | 'For Time'
export type BlockKey = 'rozcvička' | 'hlavní' | 'zklidnění'

/** Parametry šablony formátu (FR-36). Nevyplněné hodnoty se doplní výchozími. */
export type TemplateParams = {
  workSec?: number // Tabata, TRX: práce
  restSec?: number // Tabata, TRX: pauza/přechod
  rounds?: number // Tabata (kol na cvik), TRX (kol okruhu), For Time (kol)
  pauseSec?: number // Tabata: pauza mezi cviky, TRX: pauza mezi koly
}

export type GeneratorInput = {
  level: Level
  muscles: string[] // prázdné = všechny
  equipment: string[] // dostupné pomůcky; „vlastní váha“ je vždy k dispozici
  environment: 'uvnitř' | 'venku'
  format: Format
  subtype?: Subtype // jen CrossFit, jedna část
  /** CrossFit: části hlavního tréninku, např. AMRAP 20 min + EMOM 10 min. Má přednost před subtype a mainMin. */
  segments?: { type: Subtype; minutes: number }[]
  warmupMin: number
  mainMin: number
  cooldownMin: number
  cardioStrength: number // 1 až 5, výchozí 3
  groupSize?: number
  groupName?: string
  title?: string
  params?: TemplateParams
  seed?: number
}

export type WorkoutExercise = {
  id: string
  name: string
  /** Alternativní (anglický) název, v CrossFitu se zobrazí v závorce. */
  altName?: string
  description: string
  videoUrl: string | null
  muscle: string
  level: string
  equipment: string[]
  /** Čas / opakování připravené k zobrazení, např. „12×“, „30 s“. */
  valueText?: string
  /** Pro EMOM: minuty, ve kterých se cvik dělá. */
  note?: string
}

export type WorkoutBlock = {
  key: BlockKey
  minutes: number
  /** Popisek části hlavního tréninku, např. „AMRAP 20 min“. */
  label?: string
  /** Časová struktura bloku čitelná pro člověka. */
  structure: string
  exercises: WorkoutExercise[]
}

export type GeneratedWorkout = {
  title: string
  date: string
  groupName?: string
  groupSize?: number
  format: Format
  subtype?: Subtype
  totalMinutes: number
  blocks: WorkoutBlock[]
  params: Required<TemplateParams>
  warnings: string[]
}

export type GenerateResult =
  | { ok: true; workout: GeneratedWorkout }
  | { ok: false; error: string }

export type Lib = Exercise[]
