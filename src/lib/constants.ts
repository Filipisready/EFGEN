/** Svalové partie podle oblastí těla. „Celé tělo“ není cílitelná partie (jen vlastnost cviku). */
export const MUSCLE_GROUPS = [
  { label: 'Horní tělo', muscles: ['hrudník', 'záda', 'ramena', 'biceps', 'triceps'] },
  { label: 'Střed těla', muscles: ['břicho'] },
  { label: 'Dolní tělo', muscles: ['hýždě', 'přední stehna', 'zadní stehna', 'lýtka'] },
] as const
export const TARGET_MUSCLES = MUSCLE_GROUPS.flatMap((g) => g.muscles) as readonly string[]
export const MUSCLES = [...MUSCLE_GROUPS.flatMap((g) => g.muscles), 'celé tělo'] as unknown as readonly [
  'hrudník', 'záda', 'ramena', 'biceps', 'triceps', 'břicho', 'hýždě', 'přední stehna', 'zadní stehna', 'lýtka', 'celé tělo',
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
