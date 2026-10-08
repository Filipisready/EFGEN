import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { deleteUserAction } from '@/lib/admin-actions'
import { Alert, btn2Cls } from '@/components/ui'
import { ConfirmButton } from '@/components/confirm-button'

export const metadata = { title: 'Uživatelé · EFGEN' }

export default async function Page({ searchParams }: { searchParams: Promise<{ chyba?: string; ok?: string }> }) {
  const { chyba, ok } = await searchParams
  const { profile } = await requireAdmin()
  const db = createAdminClient()
  const [{ data: users }, { data: wk }] = await Promise.all([
    db.from('profiles').select('id,email,display_name,role,created_at').order('created_at', { ascending: false }),
    db.from('workouts').select('user_id').limit(50000),
  ])
  const counts = new Map<string, number>()
  for (const w of wk ?? []) counts.set(w.user_id, (counts.get(w.user_id) ?? 0) + 1)

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Uživatelé <span className="text-base font-normal text-muted">({users?.length ?? 0})</span></h1>
        <a href="/api/admin/backup" className={btn2Cls}>Stáhnout zálohu dat</a>
      </div>
      <p className="text-sm text-muted">Záloha obsahuje cviky, pomůcky, uživatele a tréninky ve formátu JSON. Doporučuji ji stahovat pravidelně, bezplatná databáze nemá automatické zálohy.</p>
      {chyba && <Alert>{chyba}</Alert>}
      {ok && <Alert kind="ok">Uživatel byl smazán i s jeho tréninky.</Alert>}
      <ul className="divide-y divide-line rounded-lg border border-line">
        {(users ?? []).map((u) => (
          <li key={u.id} className="flex flex-wrap items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <span className="font-medium">{u.email}</span>{u.role === 'admin' && <span className="ml-2 rounded bg-surface-2 px-1.5 py-0.5 text-xs">admin</span>}
              <p className="text-sm text-muted">{u.display_name ? `${u.display_name} · ` : ''}registrace {new Date(u.created_at).toLocaleDateString('cs-CZ')} · tréninků: {counts.get(u.id) ?? 0}</p>
            </div>
            {u.id !== profile.id && (
              <ConfirmButton action={deleteUserAction.bind(null, u.id)} message={`Opravdu smazat uživatele ${u.email} včetně všech jeho tréninků? Nelze to vrátit.`} className="text-sm text-danger underline">Smazat</ConfirmButton>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
