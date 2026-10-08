import type { GeneratedWorkout } from '@/lib/generator/types'
import { altLabel } from '@/lib/generator/display'

const NAMES = { rozcvička: 'Rozcvička', hlavní: 'Hlavní část', zklidnění: 'Zklidnění' } as const

export function WorkoutView({ w }: { w: GeneratedWorkout }) {
  const sub = w.subtype ? ` · ${w.subtype}` : ''
  return (
    <article className="space-y-6 rounded-xl border border-line p-4 sm:p-6">
      <header className="space-y-1 border-b border-line pb-4">
        <h2 className="text-2xl font-bold">{w.title}</h2>
        <p className="text-muted">
          {new Date(w.date).toLocaleDateString('cs-CZ')} · {w.format}{sub} · celkem {w.totalMinutes} min
          {w.groupName && <> · {w.groupName}</>}
          {w.groupSize && <> · {w.groupSize} osob</>}
        </p>
        <p className="text-sm text-muted">
          {w.blocks.map((b) => `${b.label ?? NAMES[b.key]} ${b.label ? '' : b.minutes + ' min'}`.trim()).join(' · ')}
        </p>
      </header>
      {w.warnings.map((m) => (
        <p key={m} role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">{m}</p>
      ))}
      {w.blocks.map((b) => (
        <section key={b.key} className="space-y-3">
          <div>
            <h3 className="text-xl font-semibold">{b.label ? `Hlavní část: ${b.label}` : NAMES[b.key]} {!b.label && <span className="text-base font-normal text-muted">· {b.minutes} min</span>}</h3>
            <p className="text-sm text-muted">{b.structure}</p>
          </div>
          <ol className="space-y-3">
            {b.exercises.map((e, i) => (
              <li key={e.id} className="flex gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-bg tnum">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-lg font-medium leading-snug">
                    {e.name}
                    {altLabel(w.format, e.name, e.altName) && <span className="font-normal text-muted"> ({altLabel(w.format, e.name, e.altName)})</span>}
                    {e.valueText && <span className="ml-2 rounded bg-surface-2 px-2 py-0.5 text-base font-semibold">{e.valueText}</span>}
                    {e.note && <span className="ml-2 text-sm font-normal text-muted">({e.note})</span>}
                  </p>
                  <p className="text-ink/80">{e.description}</p>
                  {e.userNote && <p className="text-sm italic">Poznámka: {e.userNote}</p>}
                  {e.videoUrl && <a href={e.videoUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline">Video</a>}
                </div>
              </li>
            ))}
            {!b.exercises.length && <li className="text-muted">Žádné vhodné cviky.</li>}
          </ol>
        </section>
      ))}
      {w.note && <p className="border-t border-line pt-3 text-sm"><b>Poznámka:</b> {w.note}</p>}
    </article>
  )
}
