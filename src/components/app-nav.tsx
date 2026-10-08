'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type NavItem = { href: string; label: string; icon: 'plus' | 'list' | 'user' | 'dumbbell' | 'tool' | 'users' }

const ICONS: Record<NavItem['icon'], string> = {
  plus: 'M12 5v14M5 12h14',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  dumbbell: 'M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11',
  tool: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5 2.5-2.5Z',
  users: 'M17 21v-2a4 4 0 0 0-3-3.9M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM16 3.1a4 4 0 0 1 0 7.8',
}

export function Icon({ name, className = 'size-5' }: { name: NavItem['icon']; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  )
}

const active = (path: string, href: string) => (href === '/app' ? path === '/app' : path === href || path.startsWith(href + '/'))

/** Horní navigace pro širší obrazovky. */
export function TopNav({ items }: { items: NavItem[] }) {
  const path = usePathname()
  return (
    <nav aria-label="Hlavní navigace" className="hidden items-center gap-1 md:flex">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={active(path, i.href) ? 'page' : undefined}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${active(path, i.href) ? 'bg-accent text-accent-ink' : 'text-muted hover:bg-surface-2 hover:text-ink'}`}>
          {i.label}
        </Link>
      ))}
    </nav>
  )
}

/** Spodní navigace na telefonu: nejdůležitější akce na dosah palce. */
export function BottomNav({ items }: { items: NavItem[] }) {
  const path = usePathname()
  return (
    <nav aria-label="Hlavní navigace" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md justify-around">
        {items.map((i) => (
          <li key={i.href} className="flex-1">
            <Link href={i.href} aria-current={active(path, i.href) ? 'page' : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${active(path, i.href) ? 'text-ink' : 'text-muted'}`}>
              <span className={`flex h-7 w-12 items-center justify-center rounded-full transition ${active(path, i.href) ? 'bg-accent text-accent-ink' : ''}`}><Icon name={i.icon} /></span>
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
