'use client'
import { useState, useTransition } from 'react'
import { searchExercisesAction, swapOptionsAction } from '@/lib/generator-actions'
import { addExercise, moveExercise, removeExercise, replaceExercise, setBlockMinutes, setExerciseNote, setParams } from '@/lib/generator/edit'
import { altLabel } from '@/lib/generator/display'
import type { GeneratedWorkout, WorkoutExercise } from '@/lib/generator/types'
import { Badge, inputCls } from '@/components/ui'

const NAMES = { rozcvička: 'Rozcvička', hlavní: 'Hlavní část', zklidnění: 'Zklidnění' } as const
const tiny = 'inline-flex min-h-10 items-center rounded-lg border border-line-strong bg-surface px-3 text-sm font-medium hover:bg-surface-2 disabled:opacity-30'

type Panel = { bi: number; ei?: number; mode: 'swap' | 'add' } | null

export function WorkoutEditor({ workout: w, onChange }: { workout: GeneratedWorkout; onChange: (w: GeneratedWorkout) => void }) {
  const [panel, setPanel] = useState<Panel>(null)
  const [options, setOptions] = useState<WorkoutExercise[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [noteOpen, setNoteOpen] = useState<string | null>(null)
  const [openRow, setOpenRow] = useState<string | null>(null)
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
    <article className="space-y-4">
      <header className="space-y-3 rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <input aria-label="Název tréninku" value={w.title} maxLength={100} onChange={(e) => onChange({ ...w, title: e.target.value })}
          className="w-full rounded-lg bg-transparent text-2xl font-extrabold tracking-tight outline-none focus:ring-4 focus:ring-accent/50 sm:text-3xl" />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge tone="accent"><span className="tnum">{w.totalMinutes} min</span></Badge>
          <Badge>{w.format}{w.subtype ? ` ${w.subtype}` : ''}</Badge>
          <span className="tnum text-muted">{new Date(w.date).toLocaleDateString('cs-CZ')}</span>
          {w.groupName && <span className="text-muted">· {w.groupName}</span>}
          {w.groupSize && <span className="text-muted">· {w.groupSize} osob</span>}
        </div>
        <p className="tnum text-sm text-muted">{w.blocks.map((b) => `${b.label ?? NAMES[b.key]}${b.label ? '' : ' ' + b.minutes + ' min'}`).join(' → ')}</p>
      </header>

      {w.warnings.map((m) => (
        <p key={m} role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">{m}</p>
      ))}

      {derived && (
        <details className="rounded-2xl border border-line bg-surface p-4">
          <summary className="cursor-pointer text-sm font-semibold">Časy formátu</summary>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {numField('Práce (s)', 'workSec')}
            {numField(w.format === 'TRX' ? 'Přechod (s)' : 'Pauza (s)', 'restSec')}
            {numField(w.format === 'Tabata' ? 'Kol na cvik' : 'Kol', 'rounds')}
            {numField(w.format === 'Tabata' ? 'Pauza mezi cviky (s)' : 'Pauza mezi koly (s)', 'pauseSec')}
          </div>
        </details>
      )}

      {w.blocks.map((b, bi) => (
        <section key={bi} className="space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 className="text-xl font-extrabold tracking-tight">{b.label ? `Hlavní část: ${b.label}` : NAMES[b.key]}</h3>
              {!b.label && <span className="tnum rounded-full bg-surface-2 px-2.5 py-0.5 text-sm font-semibold">{b.minutes} min</span>}
              {!(b.key === 'hlavní' && derived) && (
                <label className="ml-auto flex items-center gap-2 text-sm text-muted">Čas
                  <input type="number" inputMode="numeric" min={0} max={90} value={b.minutes} aria-label={`Čas bloku ${b.label ?? NAMES[b.key]} v minutách`} onChange={(e) => onChange(setBlockMinutes(w, bi, Number(e.target.value)))}
                    className="tnum w-16 rounded-lg border border-line-strong bg-surface px-2 py-1.5 text-center text-ink" />
                  min
                </label>
              )}
            </div>
            <p className="rounded-lg bg-accent-soft px-3 py-1.5 text-sm font-medium">{b.structure}</p>
          </div>

          <ol className="space-y-5">
            {b.exercises.map((e, ei) => {
              const nk = `${bi}-${e.id}`
              const alt = altLabel(w.format, e.name, e.altName)
              const open = openRow === nk
              return (
                <li key={e.id} className="flex gap-3">
                  <span className="tnum mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-bg">{ei + 1}</span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="text-lg font-bold leading-snug">
                      {e.name}
                      {alt && <span className="font-normal text-muted"> ({alt})</span>}
                      {e.valueText && <span className="tnum ml-2 inline-block rounded-md bg-accent px-2 py-0.5 text-base font-bold text-accent-ink">{e.valueText}</span>}
                      {e.note && <span className="ml-2 text-sm font-normal text-muted">({e.note})</span>}
                    </p>
                    <p className="text-ink/80">{e.description}</p>
                    {e.userNote && noteOpen !== nk && <p className="rounded-lg bg-surface-2 px-3 py-1.5 text-sm italic">Poznámka: {e.userNote}</p>}
                    {noteOpen === nk && (
                      <input autoFocus aria-label={`Poznámka ke cviku ${e.name}`} defaultValue={e.userNote ?? ''} maxLength={200} placeholder="Poznámka ke cviku…"
                        onBlur={(ev) => { onChange(setExerciseNote(w, bi, ei, ev.target.value)); setNoteOpen(null) }}
                        onKeyDown={(ev) => { if (ev.key === 'Enter') ev.currentTarget.blur() }} className={inputCls} />
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" aria-expanded={open} onClick={() => setOpenRow(open ? null : nk)} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink">
                        <span aria-hidden="true">{open ? '▾' : '▸'}</span> Upravit
                      </button>
                      {e.videoUrl && <a href={e.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink">▶ Video</a>}
                    </div>
                    {open && (
                      <div className="flex flex-wrap gap-2 rounded-xl bg-surface-2 p-2">
                        <button type="button" aria-label={`Posunout cvik ${e.name} nahoru`} disabled={ei === 0} onClick={() => onChange(moveExercise(w, bi, ei, -1))} className={tiny}>↑ Výš</button>
                        <button type="button" aria-label={`Posunout cvik ${e.name} dolů`} disabled={ei === b.exercises.length - 1} onClick={() => onChange(moveExercise(w, bi, ei, 1))} className={tiny}>↓ Níž</button>
                        <button type="button" onClick={() => load({ bi, ei, mode: 'swap' })} className={tiny}>⇄ Vyměnit</button>
                        <button type="button" onClick={() => { setNoteOpen(nk); setOpenRow(null) }} className={tiny}>✎ Poznámka</button>
                        <button type="button" onClick={() => { onChange(removeExercise(w, bi, ei)); setOpenRow(null) }} className={`${tiny} text-danger`}>✕ Odebrat</button>
                      </div>
                    )}

                    {panel?.mode === 'swap' && panel.bi === bi && panel.ei === ei && (
                      <OptionsList title="Vyberte náhradu" options={options} pending={pending} err={err} onPick={pick} onClose={close}
                        onMore={() => load({ bi, ei, mode: 'swap' })} />
                    )}
                  </div>
                </li>
              )
            })}
            {!b.exercises.length && <li className="text-muted">Žádné cviky. Přidejte nějaký níže.</li>}
          </ol>

          {panel?.mode === 'add' && panel.bi === bi ? (
            <div className="space-y-2 rounded-xl border border-line p-3">
              <form onSubmit={(ev) => { ev.preventDefault(); load({ bi, mode: 'add' }, query) }} className="flex gap-2">
                <input autoFocus value={query} onChange={(ev) => setQuery(ev.target.value)} placeholder="Hledat cvik, partii…" className={inputCls} aria-label="Hledat cvik" />
                <button className={tiny}>Hledat</button>
              </form>
              <OptionsList title="Cviky vhodné pro tento blok" options={options} pending={pending} err={err} onPick={pick} onClose={close} />
            </div>
          ) : (
            <button type="button" onClick={() => { setQuery(''); load({ bi, mode: 'add' }) }} className="min-h-11 w-full rounded-xl border border-dashed border-line-strong text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink">+ Přidat cvik</button>
          )}
        </section>
      ))}

      <label className="block space-y-1.5 rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <span className="text-sm font-semibold">Poznámka k tréninku</span>
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
    <div className="space-y-2 rounded-xl border border-line bg-surface p-2">
      <div className="flex items-center justify-between gap-2 px-1 text-sm">
        <span className="font-semibold">{title}</span>
        <span className="flex gap-1.5">
          {onMore && <button type="button" onClick={onMore} className={tiny}>Jiné návrhy</button>}
          <button type="button" onClick={onClose} className={tiny}>Zavřít</button>
        </span>
      </div>
      {pending && <p className="px-1 text-sm text-muted">Načítám…</p>}
      {err && <p className="px-1 text-sm text-danger">{err}</p>}
      {!pending && !err && !options.length && <p className="px-1 text-sm text-muted">Žádné vhodné cviky. Zkuste jiný dotaz nebo změňte pomůcky v zadání.</p>}
      <ul className="max-h-72 divide-y divide-line overflow-auto">
        {options.map((o) => (
          <li key={o.id}>
            <button type="button" onClick={() => onPick(o)} className="block min-h-12 w-full rounded-lg px-2 py-2 text-left hover:bg-surface-2">
              <span className="font-semibold">{o.name}</span>
              <span className="block text-sm text-muted">{o.muscle} · {o.level}{o.equipment.length ? ' · ' + o.equipment.join(', ') : ''}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
