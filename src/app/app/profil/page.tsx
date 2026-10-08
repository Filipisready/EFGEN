import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { NameForm, PasswordForm } from '@/components/profile-forms'

export const metadata = { title: 'Profil · EFGEN' }

export default async function Page() {
  const { profile } = await requireUser()
  const supabase = await createClient()
  const { count } = await supabase.from('workouts').select('id', { count: 'exact', head: true })
  return (
    <div className="max-w-md space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Profil</h1>
        <p className="text-neutral-600 dark:text-neutral-400">{profile.email}{profile.role === 'admin' && ' · administrátor'}</p>
        <p className="text-sm text-neutral-500">Uložených tréninků: <Link href="/app/historie" className="underline">{count ?? 0}</Link></p>
      </div>
      <section className="space-y-3"><h2 className="text-lg font-semibold">Jméno</h2><NameForm name={profile.display_name ?? ''} /></section>
      <section className="space-y-3"><h2 className="text-lg font-semibold">Změna hesla</h2><PasswordForm /></section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Smazání účtu</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Pokud chcete smazat účet a všechny své tréninky, napište na <a className="underline" href="mailto:sulc.filip@gmail.com?subject=Smazání účtu EFGEN">sulc.filip@gmail.com</a> z adresy, se kterou jste registrováni.</p>
      </section>
    </div>
  )
}
