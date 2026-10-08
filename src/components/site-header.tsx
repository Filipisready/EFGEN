'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/logo'

/** Hlavička veřejných stránek. Uvnitř aplikace (/app, /admin) ji nahrazuje vlastní. */
export function SiteHeader() {
  const path = usePathname()
  if (path === '/app' || path.startsWith('/app/') || path === '/admin' || path.startsWith('/admin/')) return null
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
      <Logo />
      <nav className="flex items-center gap-1 text-sm font-medium">
        <Link href="/prihlaseni" className="rounded-lg px-3 py-2 hover:bg-surface-2">Přihlásit se</Link>
        <Link href="/registrace" className="rounded-lg bg-accent px-3.5 py-2 text-accent-ink hover:brightness-95">Registrace</Link>
      </nav>
    </header>
  )
}
