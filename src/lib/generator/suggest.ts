import type { Exercise } from '@/lib/constants'
import { buildPools, poolFor } from './pools'
import type { BlockKey, WorkoutContext } from './types'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

type Scope = { ctx: WorkoutContext; key: BlockKey; usedIds: string[]; blockIds: string[] }

/** Kandidáti pro daný blok: stejná tvrdá pravidla jako generátor, bez cviků, které už v tréninku jsou. */
function candidates(lib: Exercise[], { ctx, key, usedIds, blockIds }: Scope, ignoreId?: string): Exercise[] {
  const pool = poolFor(buildPools(lib, ctx), key).filter((e) => !usedIds.includes(e.id))
  if (ctx.format === 'TRX' && key === 'hlavní') {
    // Pravidlo 1: v TRX je max. 20 % cviků bez pomůcky TRX.
    const byId = new Map(lib.map((e) => [e.id, e]))
    const others = blockIds.filter((id) => id !== ignoreId).map((id) => byId.get(id)).filter(Boolean) as Exercise[]
    const nonTrx = others.filter((e) => !e.equipment.includes('TRX')).length
    const max = Math.floor(blockIds.length * 0.2)
    return pool.filter((e) => e.equipment.includes('TRX') || nonTrx + 1 <= max)
  }
  return pool
}

/** Náhrady za jeden cvik: podobná partie, pohyb a intenzita, s trochou náhody. */
export function findReplacements(lib: Exercise[], scope: Scope, targetId: string, limit = 8, rnd: () => number = Math.random): Exercise[] {
  const target = lib.find((e) => e.id === targetId)
  const pool = candidates(lib, scope, targetId)
  const score = (e: Exercise) => {
    if (!target) return rnd()
    let s = 0
    if (e.muscle === target.muscle) s += 3
    if (e.movement === target.movement) s += 2
    if (e.level === target.level) s += 1
    s -= Math.abs(e.cardio_strength - target.cardio_strength) * 0.8
    return s + rnd() * 2
  }
  return pool.map((e) => [e, score(e)] as const).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([e]) => e)
}

/** Vyhledávání v knihovně pro ruční přidání cviku. Bez dotazu vrací abecední začátek. */
export function searchLibrary(lib: Exercise[], scope: Scope, query: string, limit = 30): Exercise[] {
  const q = norm(query.trim())
  return candidates(lib, scope)
    .filter((e) => !q || norm(e.name).includes(q) || (e.alt_name && norm(e.alt_name).includes(q)) || norm(e.muscle).includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, 'cs'))
    .slice(0, limit)
}
