import type { Exercise } from '@/lib/constants'

export type Level = 'začátečník' | 'pokročilý' | 'expert'
export type Format = 'Kruhový trénink' | 'TRX' | 'CrossFit'
export type Subtype = 'AMRAP' | 'EMOM' | 'For Time'
export type BlockKey = 'rozcvička' | 'hlavní' | 'zklidnění'

export type Mode = 'cas' | 'opak'

/**
 * Parametry šablony hlavní části (FR-36). Nevyplněné hodnoty se doplní výchozími.
 * Hlavní část kruhového tréninku a TRX se skládá z bloků (A, B, C…), každý blok má stejný počet cviků
 * a opakuje se v sériích. Klasický okruh je jeden blok.
 */
export type TemplateParams = {
  workSec?: number // kruhový trénink, TRX: práce na stanici
  restSec?: number // kruhový trénink, TRX: přechod mezi stanicemi
  rounds?: number // kruhový trénink, TRX: kol okruhu; CrossFit For Time: kol
  pauseSec?: number // kruhový trénink, TRX: pauza mezi koly (sériemi)
  blocks?: number // počet bloků (1 = klasický okruh)
  perBlock?: number // cviků v bloku, 0 = dopočítat z délky hlavní části
  mode?: Mode // 'cas' = práce/přechod, 'opak' = počet opakování
  reps?: number // opakování na cvik (mode 'opak')
  restBetweenSec?: number // pauza mezi cviky (mode 'opak')
  pauseBlocksSec?: number // pauza mezi bloky (např. na pití)
}

/** Zadání, ze kterého trénink vznikl. Potřebné pro výměnu a přidání cviků po vygenerování. */
export type WorkoutContext = {
  level: Level
  environment: 'uvnitř' | 'venku'
  equipment: string[]
  format: Format
  muscles: string[]
  cardioStrength: number
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
  /** Cviky měřené časem nebo vzdáleností (výdrže) se v režimu na opakování zobrazí touto hodnotou, např. „30 s“. */
  holdText?: string
  /** Pro EMOM: minuty, ve kterých se cvik dělá (počítá aplikace). */
  note?: string
  /** Poznámka trenéra ke cviku. */
  userNote?: string
}

export type WorkoutBlock = {
  key: BlockKey
  minutes: number
  /** Popisek části hlavního tréninku, např. „AMRAP 20 min“. */
  label?: string
  /** Typ části CrossFitu (AMRAP, EMOM, For Time). */
  type?: Subtype
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
  context: WorkoutContext
  /** Poznámka trenéra k celému tréninku. */
  note?: string
  warnings: string[]
}

export type GenerateResult =
  | { ok: true; workout: GeneratedWorkout }
  | { ok: false; error: string }

export type Lib = Exercise[]
