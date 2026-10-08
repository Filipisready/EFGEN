import type { Format } from './types'

/** Anglický název v závorce se ukazuje jen v CrossFitu a jen když přináší novou informaci. */
export function altLabel(format: Format, name: string, alt?: string | null): string | null {
  if (format !== 'CrossFit' || !alt) return null
  const n = name.toLowerCase(), a = alt.toLowerCase()
  return n === a || n.includes(a) ? null : alt
}
