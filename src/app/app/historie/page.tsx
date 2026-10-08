import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { btnCls, btn2Cls, inputCls } from '@/components/ui'

export const metadata = { title: 'Historie · EFGEN' }

const PAGE = 20
type Row = { id: string; title: string; workout_date: string; format: string; subtype: string | null; group_name: string | null; total: string | null }

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; strana?: string }> }) {
  const { q, strana } = await searchParams
  const { profile } = await requireUser()
  const page = Math.max(1, Number(strana) || 1)
  const supabase = await createClient()
  let query = supabase.from('workouts')
    .select('id,title,workout_date,format,subtype,group_name,total:content->>totalMinutes', { count: 'exact' })
    .eq('user_id', profile.id).order('created_at', { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1)
  if (q?.trim()) query = query.ilike('title', `%${q.trim().replace(/[%_,()]/g, ' ')}%`)
  const { data, count, error } = await query.returns<Row[]>()
  const rows = data ?? []
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE))
  const href = (p: number) => `/app/historie?${new URLSearchParams({ ...(q ? { q } : {}), strana: String(p) })}`

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Historie tréninků <span className="text-base font-normal text-neutral-500">({count ?? 0})</span></h1>
        <Link href="/app/novy" className={btnCls}>Nový trénink</Link>
      </div>
      <form className="flex gap-2">
        <input name="q" defaultValue={q ?? ''} placeholder="Hledat podle názvu…" aria-label="Hledat podle názvu" className={inputCls} />
        <button className={btn2Cls}>Hledat</button>
      </form>
      {error && <p className="text-red-600">Historii se nepodařilo načíst.</p>}
      <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {rows.map((w) => (
          <li key={w.id}>
            <Link href={`/app/historie/${w.id}`} className="block min-h-14 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-900">
              <span className="font-medium">{w.title}</span>
              <span className="block text-sm text-neutral-500">
                {new Date(w.workout_date).toLocaleDateString('cs-CZ')} · {w.format}{w.subtype ? ` ${w.subtype}` : ''}{w.total ? ` · ${w.total} min` : ''}{w.group_name ? ` · ${w.group_name}` : ''}
              </span>
            </Link>
          </li>
        ))}
        {!rows.length && <li className="p-6 text-center text-neutral-500">{q ? 'Nic nenalezeno.' : 'Zatím nemáte žádný uložený trénink.'}</li>}
      </ul>
      {pages > 1 && (
        <nav className="flex items-center justify-between text-sm" aria-label="Stránkování">
          {page > 1 ? <Link href={href(page - 1)} className="underline">← Novější</Link> : <span />}
          <span className="text-neutral-500">Strana {page} z {pages}</span>
          {page < pages ? <Link href={href(page + 1)} className="underline">Starší →</Link> : <span />}
        </nav>
      )}
    </div>
  )
}
