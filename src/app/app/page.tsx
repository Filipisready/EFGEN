import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { btnCls, btn2Cls } from '@/components/ui'

export const metadata = { title: 'Přehled · EFGEN' }

export default async function Page() {
  const { profile } = await requireUser()
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Vítejte{profile.display_name ? `, ${profile.display_name}` : ''}</h1>
      <p className="text-neutral-600 dark:text-neutral-400">Sestavte trénink na míru své skupině. Historie bude přidána v další etapě.</p>
      <Link href="/app/novy" className={btnCls}>Nový trénink</Link>
      {profile.role === 'admin' && <Link href="/admin/cviky" className={btn2Cls}>Správa cviků</Link>}
    </div>
  )
}
