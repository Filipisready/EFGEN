export const MUSCLES = ['nohy', 'záda', 'core', 'hrudník', 'ramena', 'paže', 'celé tělo'] as const
export const LEVELS = ['začátečník', 'pokročilý', 'expert'] as const
export const ENVIRONMENTS = ['uvnitř', 'venku', 'obojí'] as const
export const FORMATS = ['Tabata', 'TRX', 'CrossFit'] as const
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
