import Link from 'next/link'
import type { ReactNode } from 'react'
import { logout } from '@/lib/auth-actions'
import type { Profile } from '@/lib/auth'
import { Logo } from '@/components/logo'
import { BottomNav, TopNav, type NavItem } from '@/components/app-nav'

export function Shell({ profile, children }: { profile: Profile; children: ReactNode }) {
  const main: NavItem[] = [
    { href: '/app/novy', label: 'Nový trénink', icon: 'plus' },
    { href: '/app/historie', label: 'Historie', icon: 'list' },
    { href: '/app/profil', label: 'Profil', icon: 'user' },
  ]
  const admin: NavItem[] = [
    { href: '/admin/cviky', label: 'Cviky', icon: 'dumbbell' },
    { href: '/admin/pomucky', label: 'Pomůcky', icon: 'tool' },
    { href: '/admin/uzivatele', label: 'Uživatelé', icon: 'users' },
  ]
  const isAdmin = profile.role === 'admin'
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
          <Logo href="/app" size={30} />
          <TopNav items={isAdmin ? [...main, ...admin] : main} />
          <div className="ml-auto flex items-center gap-1">
            <Link href="/app/profil" className="hidden rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-ink sm:block">{profile.display_name || profile.email}</Link>
            <form action={logout}><button className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-surface-2">Odhlásit</button></form>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 md:pb-10">{children}</div>
      <BottomNav items={isAdmin ? [...main, { href: '/admin/cviky', label: 'Správa', icon: 'dumbbell' }] : main} />
    </>
  )
}
