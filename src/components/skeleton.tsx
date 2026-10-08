/** Jednoduchý zástupný obrazec při načítání stránky. */
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-label="Načítám">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-2" />
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-2" style={{ opacity: 1 - i * 0.12 }} />)}
      <span className="sr-only">Načítám…</span>
    </div>
  )
}
