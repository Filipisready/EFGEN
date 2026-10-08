import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { btnCls, btn2Cls } from '@/components/ui'

export const metadata = { title: 'Přehled · EFGEN' }

export default async function Page() {
  const { profile } = await requireUser()
  const supabase = await createClient()
  const { data: recent } = await supabase.from('workouts').select('id,title,workout_date,format').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(5)
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Vítejte{profile.display_name ? `, ${profile.display_name}` : ''}</h1>
      <p className="text-muted">Sestavte trénink na míru své skupině. </p>
      <Link href="/app/novy" className={btnCls}>Nový trénink</Link>
      {!!recent?.length && (
        <section className="space-y-2 pt-4">
          <h2 className="text-lg font-semibold">Poslední tréninky</h2>
          <ul className="divide-y divide-line rounded-lg border border-line">
            {recent.map((w) => (
              <li key={w.id}><Link href={`/app/historie/${w.id}`} className="block min-h-12 p-3 hover:bg-surface-2"><span className="font-medium">{w.title}</span><span className="block text-sm text-muted">{new Date(w.workout_date).toLocaleDateString('cs-CZ')} · {w.format}</span></Link></li>
            ))}
          </ul>
          <Link href="/app/historie" className="text-sm underline">Celá historie</Link>
        </section>
      )}
      {profile.role === 'admin' && <Link href="/admin/cviky" className={btn2Cls}>Správa cviků</Link>}
    </div>
  )
}
