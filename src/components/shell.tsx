import Link from 'next/link'
import type { ReactNode } from 'react'
import { logout } from '@/lib/auth-actions'
import type { Profile } from '@/lib/auth'

export function Shell({ profile, children }: { profile: Profile; children: ReactNode }) {
  const link = 'rounded-md px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800'
  return (
    <>
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-4 py-2">
          <Link href="/app" className="mr-3 text-lg font-bold">EFGEN</Link>
          {profile.role === 'admin' && (
            <>
              <Link href="/admin/cviky" className={link}>Cviky</Link>
              <Link href="/admin/pomucky" className={link}>Pomůcky</Link>
            </>
          )}
          <span className="ml-auto hidden text-sm text-neutral-500 sm:inline">{profile.email}</span>
          <form action={logout}><button className={link}>Odhlásit</button></form>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl px-4 py-6">{children}</div>
    </>
  )
}
