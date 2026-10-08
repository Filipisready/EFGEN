import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { toggleExercise } from '@/lib/exercise-actions'
import { BLOCKS, FORMATS, LEVELS, MUSCLES, type Exercise } from '@/lib/constants'
import { btnCls, btn2Cls, inputCls } from '@/components/ui'

export const metadata = { title: 'Cviky · EFGEN' }

type SP = { q?: string; muscle?: string; level?: string; format?: string; block?: string; stav?: string }

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const supabase = await createClient()
  let q = supabase.from('exercises').select('*').order('name').limit(500)
  if (sp.q) q = q.or(`name.ilike.%${sp.q.replace(/[%,()]/g, ' ')}%,alt_name.ilike.%${sp.q.replace(/[%,()]/g, ' ')}%`)
  if (sp.muscle) q = q.eq('muscle', sp.muscle)
  if (sp.level) q = q.eq('level', sp.level)
  if (sp.format) q = q.contains('formats', [sp.format])
  if (sp.block) q = q.contains('blocks', [sp.block])
  if (sp.stav === 'aktivni') q = q.eq('active', true)
  if (sp.stav === 'neaktivni') q = q.eq('active', false)
  const { data, error } = await q.returns<Exercise[]>()
  const rows = data ?? []
  const sel = (name: keyof SP, opts: readonly string[], label: string) => (
    <select name={name} defaultValue={sp[name] ?? ''} className={inputCls} aria-label={label}>
      <option value="">{label}</option>
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Cviky <span className="text-base font-normal text-muted">({rows.length})</span></h1>
        <Link href="/admin/cviky/novy" className={btnCls}>Nový cvik</Link>
      </div>
      <form className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <input name="q" defaultValue={sp.q ?? ''} placeholder="Hledat…" className={`${inputCls} sm:col-span-3 lg:col-span-2`} />
        {sel('muscle', MUSCLES, 'Partie')}
        {sel('level', LEVELS, 'Úroveň')}
        {sel('format', FORMATS, 'Formát')}
        {sel('block', BLOCKS, 'Blok')}
        <select name="stav" defaultValue={sp.stav ?? ''} className={inputCls} aria-label="Stav">
          <option value="">Všechny</option><option value="aktivni">Aktivní</option><option value="neaktivni">Neaktivní</option>
        </select>
        <button className={btn2Cls}>Filtrovat</button>
      </form>
      {error && <p className="text-danger">Načtení se nepovedlo.</p>}
      <ul className="divide-y divide-line rounded-lg border border-line">
        {rows.map((e) => (
          <li key={e.id} className="flex flex-wrap items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <Link href={`/admin/cviky/${e.id}`} className="font-medium underline-offset-2 hover:underline">{e.name}</Link>
              {!e.active && <span className="ml-2 rounded bg-surface-2 px-1.5 py-0.5 text-xs">neaktivní</span>}
              <p className="text-sm text-muted">
                {e.muscle} · {e.level} · {e.formats.join(', ')} · {e.blocks.join(', ')} · {e.equipment.join(', ') || 'vlastní váha'}
              </p>
            </div>
            <form action={toggleExercise.bind(null, e.id, !e.active)}>
              <button className="text-sm underline">{e.active ? 'Deaktivovat' : 'Aktivovat'}</button>
            </form>
          </li>
        ))}
        {!rows.length && <li className="p-6 text-center text-muted">Nic nenalezeno.</li>}
      </ul>
    </div>
  )
}
