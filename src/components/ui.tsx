import type { ReactNode } from 'react'

export const inputCls =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 text-base text-neutral-900 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100'
export const btnCls =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral-900 px-5 py-2.5 text-base font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300'
export const btn2Cls =
  'inline-flex min-h-11 items-center justify-center rounded-lg border border-neutral-300 px-5 py-2.5 text-base font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-sm text-neutral-500">{hint}</span>}
    </label>
  )
}

export function Alert({ kind = 'error', children }: { kind?: 'error' | 'ok'; children: ReactNode }) {
  const c = kind === 'error'
    ? 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100'
    : 'border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100'
  return <div role="alert" className={`rounded-lg border p-3 text-sm ${c}`}>{children}</div>
}

export function Card({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-md space-y-5 px-4 py-10">{children}</main>
}
