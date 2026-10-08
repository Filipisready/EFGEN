'use client'
import { useState, useTransition } from 'react'
import { searchExercisesAction, swapOptionsAction } from '@/lib/generator-actions'
import { addExercise, moveExercise, removeExercise, replaceExercise, setBlockMinutes, setExerciseNote, setParams } from '@/lib/generator/edit'
import type { GeneratedWorkout, WorkoutExercise } from '@/lib/generator/types'
import { inputCls } from '@/components/ui'

const NAMES = { rozcvička: 'Rozcvička', hlavní: 'Hlavní část', zklidnění: 'Zklidnění' } as const
const tiny = 'min-h-9 rounded-md border border-neutral-300 px-2.5 text-sm hover:bg-neutral-100 disabled:opacity-30 dark:border-neutral-700 dark:hover:bg-neutral-800'

type Panel = { bi: number; ei?: number; mode: 'swap' | 'add' } | null

export function WorkoutEditor({ workout: w, onChange }: { workout: GeneratedWorkout; onChange: (w: GeneratedWorkout) => void }) {
  const [panel, setPanel] = useState<Panel>(null)
  const [options, setOptions] = useState<WorkoutExercise[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [noteOpen, setNoteOpen] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const scope = (bi: number) => ({
    ctx: w.context, key: w.blocks[bi].key,
    usedIds: w.blocks.flatMap((b) => b.exercises.map((e) => e.id)), blockIds: w.blocks[bi].exercises.map((e) => e.id),
  })
  const load = (p: NonNullable<Panel>, q = '') => {
    setPanel(p); setErr(null)
    start(async () => {
      const r = p.mode === 'swap'
        ? await swapOptionsAction(scope(p.bi), w.blocks[p.bi].exercises[p.ei!].id)
        : await searchExercisesAction(scope(p.bi), q)
      if (r.ok) setOptions(r.items); else { setOptions([]); setErr(r.error) }
    })
  }
  const close = () => { setPanel(null); setOptions([]); setErr(null); setQuery('') }
  const pick = (e: WorkoutExercise) => {
    if (!panel) return
    onChange(panel.mode === 'swap' ? replaceExercise(w, panel.bi, panel.ei!, e) : addExercise(w, panel.bi, e))
    close()
  }

  const derived = w.format === 'Tabata' || w.format === 'TRX'
  const numField = (label: string, k: 'workSec' | 'restSec' | 'rounds' | 'pauseSec') => (
    <label className="space-y-1 text-sm"><span>{label}</span>
      <input type="number" inputMode="numeric" min={0} value={w.params[k]} onChange={(e) => onChange(setParams(w, { [k]: Number(e.target.value) }))} className={inputCls} />
    </label>
  )

  return (
    <article className="space-y-6 rounded-xl border border-neutral-200 p-4 sm:p-6 dark:border-neutral-800">
      <header className="space-y-2 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <input aria-label="Název tréninku" value={w.title} maxLength={100} onChange={(e) => onChange({ ...w, title: e.target.value })} className="w-full bg-transparent text-2xl font-bold outline-none focus:underline" />
        <p className="text-neutral-600 dark:text-neutral-400">
          {new Date(w.date).toLocaleDateString('cs-CZ')} · {w.format}{w.subtype ? ` · ${w.subtype}` : ''} · celkem {w.totalMinutes} min
          {w.groupName && <> · {w.groupName}</>}{w.groupSize && <> · {w.groupSize} osob</>}
        </p>
        <p className="text-sm text-neutral-500">{w.blocks.map((b) => `${b.label ?? NAMES[b.key]}${b.label ? '' : ' ' + b.minutes + ' min'}`).join(' · ')}</p>
      </header>

      {w.warnings.map((m) => (
        <p key={m} role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">{m}</p>
      ))}

      {derived && (
        <details className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
          <summary className="cursor-pointer text-sm font-medium">Časy formátu</summary>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {numField('Práce (s)', 'workSec')}
            {numField(w.format === 'TRX' ? 'Přechod (s)' : 'Pauza (s)', 'restSec')}
            {numField(w.format === 'Tabata' ? 'Kol na cvik' : 'Kol', 'rounds')}
            {numField(w.format === 'Tabata' ? 'Pauza mezi cviky (s)' : 'Pauza mezi koly (s)', 'pauseSec')}
          </div>
        </details>
      )}

      {w.blocks.map((b, bi) => (
        <section key={bi} className="space-y-3">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h3 className="text-xl font-semibold">{b.label ? `Hlavní část: ${b.label}` : NAMES[b.key]}</h3>
            {!b.label && <span className="text-neutral-500">{b.minutes} min</span>}
            {!(b.key === 'hlavní' && derived) && (
              <label className="ml-auto flex items-center gap-2 text-sm text-neutral-500">Čas (min)
                <input type="number" inputMode="numeric" min={0} max={90} value={b.minutes} onChange={(e) => onChange(setBlockMinutes(w, bi, Number(e.target.value)))} className="w-20 rounded-md border border-neutral-300 bg-transparent px-2 py-1 dark:border-neutral-700" />
              </label>
            )}
          </div>
          <p className="text-sm text-neutral-500">{b.structure}</p>

          <ol className="space-y-4">
            {b.exercises.map((e, ei) => {
              const nk = `${bi}-${e.id}`
              return (
                <li key={e.id} className="flex gap-3">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">{ei + 1}</span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="text-lg font-medium leading-snug">
                      {e.name}
                      {w.format === 'CrossFit' && e.altName && e.altName.toLowerCase() !== e.name.toLowerCase() && <span className="font-normal text-neutral-500"> ({e.altName})</span>}
                      {e.valueText && <span className="ml-2 rounded bg-neutral-100 px-2 py-0.5 text-base font-semibold dark:bg-neutral-800">{e.valueText}</span>}
                      {e.note && <span className="ml-2 text-sm font-normal text-neutral-500">({e.note})</span>}
                    </p>
                    <p className="text-neutral-700 dark:text-neutral-300">{e.description}</p>
                    {e.userNote && noteOpen !== nk && <p className="text-sm italic text-neutral-600 dark:text-neutral-400">Poznámka: {e.userNote}</p>}
                    {noteOpen === nk && (
                      <input autoFocus aria-label={`Poznámka ke cviku ${e.name}`} defaultValue={e.userNote ?? ''} maxLength={200} placeholder="Poznámka ke cviku…"
                        onBlur={(ev) => { onChange(setExerciseNote(w, bi, ei, ev.target.value)); setNoteOpen(null) }}
                        onKeyDown={(ev) => { if (ev.key === 'Enter') ev.currentTarget.blur() }} className={inputCls} />
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      <button type="button" aria-label={`Posunout cvik ${e.name} nahoru`} disabled={ei === 0} onClick={() => onChange(moveExercise(w, bi, ei, -1))} className={tiny}>↑</button>
                      <button type="button" aria-label={`Posunout cvik ${e.name} dolů`} disabled={ei === b.exercises.length - 1} onClick={() => onChange(moveExercise(w, bi, ei, 1))} className={tiny}>↓</button>
                      <button type="button" onClick={() => load({ bi, ei, mode: 'swap' })} className={tiny}>Vyměnit</button>
                      <button type="button" onClick={() => setNoteOpen(nk)} className={tiny}>Poznámka</button>
                      <button type="button" onClick={() => onChange(removeExercise(w, bi, ei))} className={`${tiny} text-red-600`}>Odebrat</button>
                      {e.videoUrl && <a href={e.videoUrl} target="_blank" rel="noopener noreferrer" className={`${tiny} inline-flex items-center`}>Video</a>}
                    </div>

                    {panel?.mode === 'swap' && panel.bi === bi && panel.ei === ei && (
                      <OptionsList title="Vyberte náhradu" options={options} pending={pending} err={err} onPick={pick} onClose={close}
                        onMore={() => load({ bi, ei, mode: 'swap' })} />
                    )}
                  </div>
                </li>
              )
            })}
            {!b.exercises.length && <li className="text-neutral-500">Žádné cviky. Přidejte nějaký níže.</li>}
          </ol>

          {panel?.mode === 'add' && panel.bi === bi ? (
            <div className="space-y-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
              <form onSubmit={(ev) => { ev.preventDefault(); load({ bi, mode: 'add' }, query) }} className="flex gap-2">
                <input autoFocus value={query} onChange={(ev) => setQuery(ev.target.value)} placeholder="Hledat cvik, partii…" className={inputCls} aria-label="Hledat cvik" />
                <button className={tiny}>Hledat</button>
              </form>
              <OptionsList title="Cviky vhodné pro tento blok" options={options} pending={pending} err={err} onPick={pick} onClose={close} />
            </div>
          ) : (
            <button type="button" onClick={() => { setQuery(''); load({ bi, mode: 'add' }) }} className={tiny}>+ Přidat cvik</button>
          )}
        </section>
      ))}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Poznámka k tréninku</span>
        <textarea value={w.note ?? ''} maxLength={1000} rows={3} onChange={(e) => onChange({ ...w, note: e.target.value || undefined })} className={inputCls} placeholder="Např. připravit bedny, skupina po zranění…" />
      </label>
    </article>
  )
}

function OptionsList({ title, options, pending, err, onPick, onClose, onMore }: {
  title: string; options: WorkoutExercise[]; pending: boolean; err: string | null
  onPick: (e: WorkoutExercise) => void; onClose: () => void; onMore?: () => void
}) {
  return (
    <div className="space-y-2 rounded-lg border border-neutral-200 p-2 dark:border-neutral-800">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{title}</span>
        <span className="flex gap-1.5">
          {onMore && <button type="button" onClick={onMore} className={tiny}>Jiné návrhy</button>}
          <button type="button" onClick={onClose} className={tiny}>Zavřít</button>
        </span>
      </div>
      {pending && <p className="text-sm text-neutral-500">Načítám…</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
      {!pending && !err && !options.length && <p className="text-sm text-neutral-500">Žádné vhodné cviky. Zkuste jiný dotaz nebo změňte pomůcky v zadání.</p>}
      <ul className="max-h-72 divide-y divide-neutral-200 overflow-auto dark:divide-neutral-800">
        {options.map((o) => (
          <li key={o.id}>
            <button type="button" onClick={() => onPick(o)} className="block min-h-11 w-full px-2 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <span className="font-medium">{o.name}</span>
              <span className="block text-sm text-neutral-500">{o.muscle} · {o.level}{o.equipment.length ? ' · ' + o.equipment.join(', ') : ''}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
