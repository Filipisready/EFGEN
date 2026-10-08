import type { ReactNode } from 'react'

// Základní prvky rozhraní. Barvy jsou sémantické tokeny z globals.css.
export const inputCls =
  'w-full min-h-12 rounded-xl border border-line-strong bg-surface px-3.5 py-3 text-base text-ink placeholder:text-muted/70 outline-none transition focus:border-ink focus:ring-4 focus:ring-accent/50'
export const btnCls =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-base font-semibold text-accent-ink transition hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-50'
export const btn2Cls =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-5 py-2.5 text-base font-medium text-ink transition hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-sm text-muted">{hint}</span>}
    </label>
  )
}

export function Alert({ kind = 'error', children }: { kind?: 'error' | 'ok' | 'warn'; children: ReactNode }) {
  const c = {
    error: 'border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100',
    ok: 'border-green-300 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100',
    warn: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
  }[kind]
  return <div role="alert" className={`rounded-xl border p-3.5 text-sm ${c}`}>{children}</div>
}

/** Karta (panel s okrajem). */
export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-surface p-4 sm:p-5 ${className}`}>{children}</section>
}

/** Vystředěná karta pro přihlášení a registraci. */
export function Card({ children }: { children: ReactNode }) {
  return (
    <main id="obsah" className="mx-auto w-full max-w-md px-4 pb-10 pt-4 sm:pt-10">
      <div className="space-y-5 rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">{children}</div>
    </main>
  )
}

export function Badge({ children, tone = 'plain' }: { children: ReactNode; tone?: 'plain' | 'accent' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone === 'accent' ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-ink'}`}>{children}</span>
  )
}
