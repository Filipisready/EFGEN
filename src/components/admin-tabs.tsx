'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/admin/cviky', label: 'Cviky' },
  { href: '/admin/pomucky', label: 'Pomůcky' },
  { href: '/admin/uzivatele', label: 'Uživatelé' },
]

export function AdminTabs() {
  const path = usePathname()
  return (
    <nav aria-label="Správa" className="-mx-1 mb-5 flex gap-1 overflow-x-auto px-1 pb-1">
      {TABS.map((t) => {
        const on = path === t.href || path.startsWith(t.href + '/')
        return (
          <Link key={t.href} href={t.href} aria-current={on ? 'page' : undefined}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${on ? 'bg-ink text-bg' : 'bg-surface-2 text-muted hover:text-ink'}`}>
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
