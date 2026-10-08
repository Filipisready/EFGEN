import type { Exercise } from '@/lib/constants'
import type { BlockKey, Format, Level, WorkoutContext, WorkoutExercise } from './types'

export const RANK: Record<Level, number> = { začátečník: 0, pokročilý: 1, expert: 2 }
const LEVELS: Level[] = ['začátečník', 'pokročilý', 'expert']

/** Úroveň skupiny a o stupeň nižší (PRD 6.1). Začátečník dostane jen začátečnické cviky. */
export const allowedLevels = (l: Level) => LEVELS.filter((x) => RANK[x] <= RANK[l] && RANK[x] >= RANK[l] - 1)

export type Step = { label: string; count: number }

export function valueText(e: Exercise): string | undefined {
  if (!e.default_value) return undefined
  if (e.unit === 'opakování') return `${e.default_value}×`
  if (e.unit === 'sekundy') return `${e.default_value} s`
  return `${e.default_value} m`
}

export function toWorkoutExercise(e: Exercise, withValue: boolean): WorkoutExercise {
  return {
    id: e.id, name: e.name, altName: e.alt_name ?? undefined, description: e.description, videoUrl: e.video_url,
    muscle: e.muscle, level: e.level, equipment: e.equipment,
    valueText: withValue ? valueText(e) : undefined,
  }
}

/**
 * Tvrdá pravidla (PRD kap. 6.1 a 6.5) jako zdroj pravdy pro generátor, výměnu i ruční přidání cviku.
 * Vrací kandidáty pro jednotlivé bloky a diagnostiku, kolik cviků který filtr vyřadil.
 */
export function buildPools(lib: Exercise[], ctx: { level: Level; environment: 'uvnitř' | 'venku'; equipment: string[]; format: Format }) {
  const avail = new Set(ctx.equipment)
  const diag: Step[] = []
  let base = lib.filter((e) => e.active)
  diag.push({ label: 'aktivních cviků', count: base.length })
  base = base.filter((e) => e.environment === 'obojí' || e.environment === ctx.environment)
  diag.push({ label: `pro prostředí „${ctx.environment}“`, count: base.length })
  base = base.filter((e) => e.equipment.every((x) => avail.has(x)))
  diag.push({ label: 's dostupnými pomůckami', count: base.length })
  const levels = allowedLevels(ctx.level)
  const byLevel = base.filter((e) => levels.includes(e.level as Level))
  diag.push({ label: `pro úroveň „${ctx.level}“`, count: byLevel.length })
  // Rozcvička a zklidnění nejsou vázány na úroveň skupiny shora (pravidla 5 a 6): stačí, že cvik není těžší než skupina.
  const lowerOrEqual = base.filter((e) => RANK[e.level as Level] <= RANK[ctx.level])

  let main = byLevel.filter((e) => e.blocks.includes('hlavní') && e.formats.includes(ctx.format))
  diag.push({ label: `s rolí hlavní části a formátem ${ctx.format}`, count: main.length })
  if (ctx.format === 'TRX') {
    // Pravidlo 1: jen cviky s pomůckou TRX a vlastní váha (jiné pomůcky se v TRX nepoužijí).
    main = main.filter((e) => e.equipment.includes('TRX') || e.equipment.length === 0)
  }
  const warm = lowerOrEqual.filter((e) => e.blocks.includes('rozcvička') && e.level !== 'expert' && e.cardio_strength <= 3 &&
    (e.movement !== 'skok' || e.level === 'začátečník'))
  const cool = lowerOrEqual.filter((e) => e.blocks.includes('zklidnění') && e.cardio_strength === 2 && e.level !== 'expert' && e.movement !== 'skok')
  return { diag, main, warm, cool, byLevel }
}

export function poolFor(p: ReturnType<typeof buildPools>, key: BlockKey): Exercise[] {
  return key === 'hlavní' ? p.main : key === 'rozcvička' ? p.warm : p.cool
}

export function context(input: { level: Level; environment: 'uvnitř' | 'venku'; equipment: string[]; format: Format; muscles: string[]; cardioStrength: number }): WorkoutContext {
  const { level, environment, equipment, format, muscles, cardioStrength } = input
  return { level, environment, equipment, format, muscles, cardioStrength }
}
