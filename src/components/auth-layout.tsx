import Link from 'next/link'
import type { ReactNode } from 'react'

/** Společné rozvržení přihlášení a registrace: slogan, přepínač a karta s formulářem. */
export function AuthLayout({ active, children }: { active: 'login' | 'register'; children: ReactNode }) {
  const tab = (on: boolean) =>
    `flex min-h-11 flex-1 items-center justify-center rounded-xl px-3 text-base transition ${on ? 'bg-accent font-semibold text-accent-ink shadow-sm' : 'font-medium text-muted hover:text-ink'}`
  return (
    <main className="mx-auto w-full max-w-md space-y-5 px-4 pb-10 pt-2 sm:pt-8">
      <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">Trénink na míru za pár sekund.</h1>

      <div className="space-y-5 rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-6">
        <div role="tablist" aria-label="Přihlášení nebo registrace" className="flex gap-1 rounded-2xl bg-surface-2 p-1">
          <Link href="/prihlaseni" role="tab" aria-selected={active === 'login'} className={tab(active === 'login')}>Přihlásit se</Link>
          <Link href="/registrace" role="tab" aria-selected={active === 'register'} className={tab(active === 'register')}>Vytvořit účet</Link>
        </div>
        {children}
      </div>
    </main>
  )
}
