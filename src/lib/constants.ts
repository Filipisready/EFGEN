/**
 * Svalové partie podle oblastí těla (pro výběr ve formuláři).
 * „Záda“ jsou složená volba: zahrnuje horní i spodní záda, pro ty, kdo je rozlišovat nechtějí.
 * „Celé tělo“ není cílitelná partie (jen vlastnost cviku).
 */
export const MUSCLE_COMPOSITES: Record<string, readonly string[]> = { záda: ['horní záda', 'spodní záda'] }
export const MUSCLE_GROUPS = [
  { label: 'Horní tělo', muscles: ['hrudník', 'záda', 'ramena', 'biceps', 'triceps'] },
  { label: 'Střed těla', muscles: ['břicho', 'šikmé břicho'] },
  { label: 'Dolní tělo', muscles: ['hýždě', 'přední stehna', 'zadní stehna', 'lýtka'] },
] as const
/** Rozbalí složenou volbu (např. „záda“) na skutečné partie cviků. */
export const expandMuscle = (m: string): readonly string[] => MUSCLE_COMPOSITES[m] ?? [m]
export const TARGET_MUSCLES: readonly string[] = [
  'hrudník', 'horní záda', 'spodní záda', 'ramena', 'biceps', 'triceps', 'břicho', 'šikmé břicho', 'hýždě', 'přední stehna', 'zadní stehna', 'lýtka',
]
/** Partie, které může mít cvik (primární). */
export const MUSCLES = [...TARGET_MUSCLES, 'celé tělo'] as unknown as readonly [
  'hrudník', 'horní záda', 'spodní záda', 'ramena', 'biceps', 'triceps', 'břicho', 'šikmé břicho', 'hýždě', 'přední stehna', 'zadní stehna', 'lýtka', 'celé tělo',
]
export const LEVELS = ['začátečník', 'pokročilý', 'expert'] as const
export const ENVIRONMENTS = ['uvnitř', 'venku', 'obojí'] as const
export const FORMATS = ['Kruhový trénink', 'TRX', 'CrossFit'] as const
export const BLOCKS = ['rozcvička', 'hlavní', 'zklidnění'] as const
export const MOVEMENTS = ['dřep', 'výpad', 'tlak', 'tah', 'záklon/předklon', 'rotace', 'skok', 'nosení', 'jiné'] as const
export const UNITS = ['opakování', 'sekundy', 'metry'] as const

export type Exercise = {
  id: string
  name: string
  alt_name: string | null
  muscle: (typeof MUSCLES)[number]
  level: (typeof LEVELS)[number]
  equipment: string[]
  environment: (typeof ENVIRONMENTS)[number]
  formats: string[]
  blocks: string[]
  cardio_strength: number
  movement: (typeof MOVEMENTS)[number]
  default_value: number | null
  unit: (typeof UNITS)[number]
  description: string
  video_url: string | null
  active: boolean
}

/** Skupiny pomůcek pro přehlednější výběr ve formuláři. Nově přidaná pomůcka bez zařazení spadne do skupiny „Další“. */
export const EQUIPMENT_GROUPS: { label: string; names: readonly string[] }[] = [
  { label: 'Činky a osy', names: ['činky', 'kettlebell', 'osa', 'osa v rohu', 'šestihranná osa', 'kotouče', 'stojan', 'lavice'] },
  { label: 'Závěsy a gymnastika', names: ['TRX', 'kruhy', 'hrazda', 'bradla', 'šplhací lano'] },
  { label: 'Bedny a stabilita', names: ['bedna', 'step', 'bosu', 'fitness míč'] },
  { label: 'Malé pomůcky', names: ['odporová guma', 'klouzáky', 'válec na protažení', 'kolečko na břicho', 'švihadlo', 'medicinbal', 'sandbag', 'zátěžová vesta', 'boxovací pytel', 'lano'] },
  { label: 'Kardio a rychlost', names: ['row', 'SkiErg', 'bike', 'echo bike', 'sáně', 'koordinační žebřík', 'kužely'] },
]
