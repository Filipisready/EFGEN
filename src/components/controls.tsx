'use client'
import type { ReactNode } from 'react'

/** Segmentovaný přepínač (jedna volba). Na telefonu velké cíle pro palec. */
export function Segmented<T extends string>({ label, value, options, onChange, name, hint }: {
  label: string; value: T; options: readonly T[]; onChange: (v: T) => void; name: string; hint?: (v: T) => string | undefined
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="grid gap-1 rounded-2xl bg-surface-2 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => (
          <label key={o} className="flex min-h-12 cursor-pointer select-none flex-col items-center justify-center rounded-xl px-2 text-center text-base font-medium transition has-[:checked]:bg-accent has-[:checked]:font-semibold has-[:checked]:text-accent-ink has-[:checked]:shadow-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink">
            <input type="radio" name={name} value={o} checked={value === o} onChange={() => onChange(o)} className="sr-only" />
            {o}
            {hint?.(o) && <span className="text-[11px] font-normal opacity-70">{hint(o)}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/** Výběr více hodnot jako „čipy“ se zaškrtnutím. */
export function ChipGroup({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      {hint && <p className="text-sm text-muted">{hint}</p>}
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  )
}

export function Chip({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label className="flex min-h-11 cursor-pointer select-none items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 text-base transition has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-bg has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      {checked && <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>}
      {children}
    </label>
  )
}

/** Číselník s tlačítky − a + (pohodlnější než psaní na telefonu). */
export function Stepper({ label, value, onChange, min = 0, max = 90, step = 1, unit = 'min' }: {
  label: string; value: string; onChange: (v: string) => void; min?: number; max?: number; step?: number; unit?: string
}) {
  const n = Number(value) || 0
  const set = (v: number) => onChange(String(Math.min(max, Math.max(min, v))))
  const btn = 'flex size-11 shrink-0 items-center justify-center rounded-xl border border-line-strong bg-surface text-2xl leading-none hover:bg-surface-2 disabled:opacity-30'
  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium">{label}<span className="font-normal text-muted"> ({unit})</span></span>
      <div className="flex items-center gap-2">
        <button type="button" aria-label={`${label}: méně`} disabled={n <= min} onClick={() => set(n - step)} className={btn}>−</button>
        <div className="min-w-0 flex-1">
          <input type="number" inputMode="numeric" aria-label={label} min={min} max={max} value={value} onChange={(e) => onChange(e.target.value)}
            className="tnum h-12 w-full rounded-xl border border-line-strong bg-surface text-center text-xl font-semibold outline-none focus:border-ink focus:ring-4 focus:ring-accent/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
        </div>
        <button type="button" aria-label={`${label}: více`} disabled={n >= max} onClick={() => set(n + step)} className={btn}>+</button>
      </div>
    </div>
  )
}

export function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <h2 className="flex items-center gap-2.5 text-lg font-bold">
        <span className="tnum flex size-7 items-center justify-center rounded-full bg-ink text-sm text-bg">{n}</span>{title}
      </h2>
      {children}
    </section>
  )
}
