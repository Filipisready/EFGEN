'use client'
import { Segmented, Stepper } from '@/components/controls'
import { circuitSeconds, resolveParams, serie, stationsForMinutes } from '@/lib/generator/templates'
import { cviku } from '@/lib/generator/templates'
import type { Format, TemplateParams } from '@/lib/generator/types'

/** Stavba hlavní části kruhového tréninku a TRX: okruh, nebo bloky A, B, C… se sériemi. Hodnoty jsou texty z políček. */
export type Layout = {
  build: 'okruh' | 'bloky'
  stations: string // cviků v okruhu / v bloku
  blocks: string
  rounds: string // kol okruhu / sérií bloku
  mode: 'cas' | 'opak'
  workSec: string
  restSec: string
  reps: string
  restBetweenSec: string
  pauseSec: string // pauza mezi koly / sériemi
  pauseBlocksSec: string // pauza mezi bloky
}

const L = (p: Partial<Layout>): Layout => ({
  build: 'okruh', stations: '6', blocks: '1', rounds: '3', mode: 'cas', workSec: '40', restSec: '20', reps: '3', restBetweenSec: '0', pauseSec: '60', pauseBlocksSec: '120', ...p,
})

export const DEFAULT_LAYOUT: Layout = L({})

/** Rychlé předvolby. Po kliknutí se vyplní políčka, která pak jde dál upravit. */
export const PRESETS: Record<'Kruhový trénink' | 'TRX', { label: string; layout: Layout }[]> = {
  'Kruhový trénink': [
    { label: 'Okruh 6 stanovišť', layout: L({}) },
    { label: 'Dlouhý okruh 15 × 30/10', layout: L({ stations: '15', rounds: '2', workSec: '30', restSec: '10' }) },
    { label: 'Silové bloky A, B, C', layout: L({ build: 'bloky', blocks: '3', stations: '5', rounds: '3', mode: 'opak', reps: '3', pauseSec: '120', pauseBlocksSec: '120' }) },
  ],
  TRX: [
    { label: 'Okruh 6 stanic', layout: L({}) },
    { label: 'Série po 3 cvicích (40/20)', layout: L({ build: 'bloky', blocks: '4', stations: '3', rounds: '3', pauseSec: '30', pauseBlocksSec: '120' }) },
  ],
}

/** Cíl tréninku: předvyplní stavbu hlavní části a poměr kardio ↔ síla. Vše jde potom dál upravit. */
export type Goal = { id: string; label: string; hint: string; ks: number; layout: Layout }
export const GOALS: Goal[] = [
  { id: 'kondice', label: 'Kondice a spalování', hint: 'Okruh 40/20, vyšší tep', ks: 2, layout: L({ stations: '8', rounds: '3', workSec: '40', restSec: '20', pauseSec: '60' }) },
  { id: 'vytrvalost', label: 'Silová vytrvalost', hint: 'Bloky, 15 opakování', ks: 3, layout: L({ build: 'bloky', blocks: '3', stations: '5', rounds: '3', mode: 'opak', reps: '15', restBetweenSec: '10', pauseSec: '60', pauseBlocksSec: '90' }) },
  { id: 'svaly', label: 'Svalová hmota', hint: 'Bloky, 10 opakování', ks: 4, layout: L({ build: 'bloky', blocks: '3', stations: '4', rounds: '4', mode: 'opak', reps: '10', restBetweenSec: '15', pauseSec: '90', pauseBlocksSec: '120' }) },
  { id: 'sila', label: 'Síla', hint: 'Bloky, 5 opakování, delší pauzy', ks: 5, layout: L({ build: 'bloky', blocks: '3', stations: '3', rounds: '5', mode: 'opak', reps: '5', restBetweenSec: '20', pauseSec: '120', pauseBlocksSec: '150' }) },
]

const n = (s: string, d = 0) => (Number.isFinite(Number(s)) && s !== '' ? Number(s) : d)

/** Parametry pro generátor. */
export function layoutParams(l: Layout): TemplateParams {
  const blocks = l.build === 'bloky' ? Math.max(1, n(l.blocks, 1)) : 1
  return {
    blocks, perBlock: Math.max(1, n(l.stations, 1)), rounds: Math.max(1, n(l.rounds, 1)),
    mode: l.build === 'bloky' ? l.mode : 'cas',
    workSec: n(l.workSec, 40), restSec: n(l.restSec, 20), reps: Math.max(1, n(l.reps, 1)), restBetweenSec: n(l.restBetweenSec),
    pauseSec: n(l.pauseSec), pauseBlocksSec: blocks > 1 ? n(l.pauseBlocksSec) : 0,
  }
}

/** Odhad délky hlavní části v minutách. */
export function layoutMinutes(format: Format, l: Layout): number {
  const p = resolveParams(format, layoutParams(l))
  return Math.max(1, Math.round(circuitSeconds(p, p.perBlock) / 60))
}

export function MainBuilder({ format, layout: l, onChange }: { format: 'Kruhový trénink' | 'TRX'; layout: Layout; onChange: (l: Layout) => void }) {
  const set = (patch: Partial<Layout>) => onChange({ ...l, ...patch })
  const p = resolveParams(format, layoutParams(l))
  const minutes = layoutMinutes(format, l)
  const bloky = l.build === 'bloky'
  const total = p.blocks * p.perBlock
  const fromMinutes = (m: string) => set({ stations: String(Math.min(40, stationsForMinutes(p, Math.max(1, n(m, 1))))) })

  return (
    <div className="space-y-4 rounded-2xl bg-surface-2 p-3 sm:p-4">
      <div className="space-y-1.5">
        <p className="text-sm font-medium">Hlavní část: předvolby</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS[format].map((pr) => (
            <button key={pr.label} type="button" onClick={() => onChange(pr.layout)}
              className="min-h-10 rounded-full border border-line-strong bg-surface px-3.5 text-sm font-medium hover:bg-surface-2">{pr.label}</button>
          ))}
        </div>
      </div>

      <Segmented name="build" label="Stavba" value={bloky ? 'Bloky A, B, C' : 'Okruh'} options={['Okruh', 'Bloky A, B, C'] as const}
        onChange={(v) => set(v === 'Okruh' ? { build: 'okruh', blocks: '1', mode: 'cas' } : { build: 'bloky', blocks: l.blocks === '1' ? '3' : l.blocks, stations: l.stations === '6' ? '5' : l.stations })} />

      {bloky ? (
        <div className="grid grid-cols-2 gap-2">
          <Stepper label="Bloků" unit="ks" value={l.blocks} onChange={(v) => set({ blocks: v })} min={2} max={8} />
          <Stepper label="Cviků v bloku" unit="ks" value={l.stations} onChange={(v) => set({ stations: v })} min={1} max={20} />
          <div className="col-span-2"><Stepper label="Sérií každého bloku" unit="ks" value={l.rounds} onChange={(v) => set({ rounds: v })} min={1} max={10} /></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2"><Stepper label="Stanovišť (cviků)" unit="ks" value={l.stations} onChange={(v) => set({ stations: v })} min={1} max={40} /></div>
          <Stepper label="Kol" unit="ks" value={l.rounds} onChange={(v) => set({ rounds: v })} min={1} max={10} />
          <Stepper label="Délka hlavní části" unit="min" value={String(minutes)} onChange={fromMinutes} min={1} max={120} />
        </div>
      )}

      {bloky && (
        <Segmented name="mode" label="Způsob práce" value={l.mode === 'opak' ? 'Na opakování' : 'Na čas'} options={['Na čas', 'Na opakování'] as const}
          onChange={(v) => set({ mode: v === 'Na čas' ? 'cas' : 'opak' })} />
      )}

      {l.mode === 'opak' && bloky ? (
        <div className="grid grid-cols-2 gap-2">
          <Stepper label="Opakování" unit="ks" value={l.reps} onChange={(v) => set({ reps: v })} min={1} max={100} />
          <Stepper label="Pauza mezi cviky" unit="s" value={l.restBetweenSec} onChange={(v) => set({ restBetweenSec: v })} min={0} max={600} step={5} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Stepper label="Práce" unit="s" value={l.workSec} onChange={(v) => set({ workSec: v })} min={5} max={300} step={5} />
          <Stepper label="Pauza / přechod" unit="s" value={l.restSec} onChange={(v) => set({ restSec: v })} min={0} max={300} step={5} />
        </div>
      )}

      <div className={`grid gap-2 ${bloky ? 'grid-cols-2' : 'grid-cols-1 sm:max-w-[50%]'}`}>
        <Stepper label={bloky ? 'Pauza mezi sériemi' : 'Pauza mezi koly'} unit="s" value={l.pauseSec} onChange={(v) => set({ pauseSec: v })} min={0} max={900} step={15} />
        {bloky && <Stepper label="Pauza mezi bloky" unit="s" value={l.pauseBlocksSec} onChange={(v) => set({ pauseBlocksSec: v })} min={0} max={1200} step={15} />}
      </div>

      <p className="tnum text-sm text-muted">
        <b className="text-ink">{cviku(total)}</b>
        {bloky ? `, ${p.blocks} bloky po ${p.perBlock}, ${serie(p.rounds)}` : `, ${p.rounds}× dokola`}, hlavní část cca <b className="text-ink">{minutes} min</b>
        {l.mode === 'opak' && bloky ? ' (čas je odhad)' : ''}.
      </p>
    </div>
  )
}
