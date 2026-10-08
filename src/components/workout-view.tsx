import type { GeneratedWorkout } from '@/lib/generator/types'

const NAMES = { rozcvička: 'Rozcvička', hlavní: 'Hlavní část', zklidnění: 'Zklidnění' } as const

export function WorkoutView({ w }: { w: GeneratedWorkout }) {
  const sub = w.subtype ? ` · ${w.subtype}` : ''
  return (
    <article className="space-y-6 rounded-xl border border-neutral-200 p-4 sm:p-6 dark:border-neutral-800">
      <header className="space-y-1 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <h2 className="text-2xl font-bold">{w.title}</h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          {new Date(w.date).toLocaleDateString('cs-CZ')} · {w.format}{sub} · celkem {w.totalMinutes} min
          {w.groupName && <> · {w.groupName}</>}
          {w.groupSize && <> · {w.groupSize} osob</>}
        </p>
        <p className="text-sm text-neutral-500">
          {w.blocks.map((b) => `${b.label ?? NAMES[b.key]} ${b.label ? '' : b.minutes + ' min'}`.trim()).join(' · ')}
        </p>
      </header>
      {w.warnings.map((m) => (
        <p key={m} role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">{m}</p>
      ))}
      {w.blocks.map((b) => (
        <section key={b.key} className="space-y-3">
          <div>
            <h3 className="text-xl font-semibold">{b.label ? `Hlavní část: ${b.label}` : NAMES[b.key]} {!b.label && <span className="text-base font-normal text-neutral-500">· {b.minutes} min</span>}</h3>
            <p className="text-sm text-neutral-500">{b.structure}</p>
          </div>
          <ol className="space-y-3">
            {b.exercises.map((e, i) => (
              <li key={e.id} className="flex gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-lg font-medium leading-snug">
                    {e.name}
                    {w.format === 'CrossFit' && e.altName && e.altName.toLowerCase() !== e.name.toLowerCase() && <span className="font-normal text-neutral-500"> ({e.altName})</span>}
                    {e.valueText && <span className="ml-2 rounded bg-neutral-100 px-2 py-0.5 text-base font-semibold dark:bg-neutral-800">{e.valueText}</span>}
                    {e.note && <span className="ml-2 text-sm font-normal text-neutral-500">({e.note})</span>}
                  </p>
                  <p className="text-neutral-700 dark:text-neutral-300">{e.description}</p>
                  {e.videoUrl && <a href={e.videoUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline">Video</a>}
                </div>
              </li>
            ))}
            {!b.exercises.length && <li className="text-neutral-500">Žádné vhodné cviky.</li>}
          </ol>
        </section>
      ))}
    </article>
  )
}
