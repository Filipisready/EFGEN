'use client'
import { useEffect, useRef, useState, useTransition } from 'react'
import { generateAction } from '@/lib/generator-actions'
import type { GeneratedWorkout, GeneratorInput } from '@/lib/generator/types'
import { WorkoutEditor } from '@/components/workout-editor'
import { ExportBar } from '@/components/export-bar'
import { SaveBar } from '@/components/save-bar'
import { Alert, Field, btnCls, btn2Cls, inputCls } from '@/components/ui'
import { Chip, ChipGroup, Section, Segmented, Stepper } from '@/components/controls'

const MUSCLES = ['nohy', 'záda', 'core', 'hrudník', 'ramena', 'paže']
const KS = ['Kardio', 'Spíše kardio', 'Vyváženě', 'Spíše síla', 'Síla']
const STORE = 'efgen.generator.v1'

export type EquipmentOption = { name: string; cf_label: string | null; formats: string[] }
type Seg = { type: 'AMRAP' | 'EMOM' | 'For Time'; minutes: string }

export function GeneratorForm({ equipment }: { equipment: EquipmentOption[] }) {
  const [level, setLevel] = useState<GeneratorInput['level']>('pokročilý')
  const [environment, setEnvironment] = useState<'uvnitř' | 'venku'>('uvnitř')
  const [format, setFormat] = useState<GeneratorInput['format']>('Tabata')
  const [segs, setSegs] = useState<Seg[]>([{ type: 'AMRAP', minutes: '20' }, { type: 'EMOM', minutes: '10' }])
  const [muscles, setMuscles] = useState<string[]>([])
  const [eq, setEq] = useState<string[]>([])
  const [warmup, setWarmup] = useState('5')
  const [main, setMain] = useState('20')
  const [cooldown, setCooldown] = useState('5')
  const [ks, setKs] = useState(3)
  const [groupSize, setGroupSize] = useState('')
  const [groupName, setGroupName] = useState('')
  const [title, setTitle] = useState('')
  const [params, setParams] = useState({ workSec: '', restSec: '', rounds: '', pauseSec: '' })
  const [workout, setWorkout] = useState<GeneratedWorkout | null>(null)
  const [genError, setGenError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [unsaved, setUnsaved] = useState(true)
  const [restored, setRestored] = useState(false)
  const [pending, start] = useTransition()
  const resRef = useRef<HTMLDivElement>(null)

  // Pamatujeme si poslední volbu pomůcek a prostředí (jen pohodlí, formulář funguje i bez toho).
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORE) ?? '{}')
      if (Array.isArray(s.eq)) {
        const kept = s.eq.filter((x: string) => equipment.some((o) => o.name === x))
        setEq(kept)
        setRestored(kept.length > 0)
      }
      if (s.environment === 'uvnitř' || s.environment === 'venku') setEnvironment(s.environment)
      if (['začátečník', 'pokročilý', 'expert'].includes(s.level)) setLevel(s.level)
    } catch { /* ignorujeme */ }
  }, [equipment])

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) => { setRestored(false); set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]) }
  const cf = format === 'CrossFit'
  const mainTotal = cf ? segs.reduce((a, x) => a + (Number(x.minutes) || 0), 0) : Number(main) || 0
  const total = (Number(warmup) || 0) + mainTotal + (Number(cooldown) || 0)
  const visibleEq = equipment.filter((o) => o.formats.includes(format))
  const eqLabel = (o: EquipmentOption) => (cf ? o.cf_label ?? o.name : o.name)

  function pickFormat(l: GeneratorInput['format']) {
    setFormat(l)
    const allowed = new Set(equipment.filter((o) => o.formats.includes(l)).map((o) => o.name))
    const next = eq.filter((x) => allowed.has(x))
    if (l === 'TRX' && !next.includes('TRX')) next.push('TRX')
    setEq(next)
  }

  function submit() {
    if (dirty && !confirm('Ruční úpravy tréninku se přegenerováním ztratí. Pokračovat?')) return
    try { localStorage.setItem(STORE, JSON.stringify({ eq, environment, level })) } catch { /* ignorujeme */ }
    const p = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '').map(([k, v]) => [k, Number(v)]))
    start(async () => {
      const r = await generateAction({
        level, muscles, equipment: eq, environment, format,
        segments: cf ? segs.map((x) => ({ type: x.type, minutes: Number(x.minutes) || 0 })) : undefined,
        warmupMin: Number(warmup) || 0, mainMin: cf ? mainTotal : Number(main) || 0, cooldownMin: Number(cooldown) || 0,
        cardioStrength: ks, groupSize: groupSize || undefined, groupName: groupName || undefined, title: title || undefined,
        params: Object.keys(p).length ? p : undefined,
      })
      if (r.ok) { setWorkout(r.workout); setGenError(null); setDirty(false); setSavedId(null); setUnsaved(true) } else { setGenError(r.error); setWorkout(null) }
      setTimeout(() => resRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    })
  }

  const par = (k: keyof typeof params, label: string, ph: string) => (
    <Field label={label}><input type="number" inputMode="numeric" min={0} value={params[k]} placeholder={ph} onChange={(e) => setParams({ ...params, [k]: e.target.value })} className={inputCls} /></Field>
  )

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => { e.preventDefault(); submit() }} className="max-w-2xl space-y-4">
        <Section n={1} title="Skupina">
          <Segmented name="level" label="Úroveň skupiny" value={level} options={['začátečník', 'pokročilý', 'expert'] as const} onChange={setLevel} />
          <Segmented name="env" label="Prostředí" value={environment} options={['uvnitř', 'venku'] as const} onChange={setEnvironment} />
        </Section>

        <Section n={2} title="Formát a časy">
          <Segmented name="format" label="Formát" value={format} options={['Tabata', 'TRX', 'CrossFit'] as const} onChange={pickFormat} />
          {cf ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Stepper label="Rozcvička" value={warmup} onChange={setWarmup} max={30} />
                <Stepper label="Zklidnění" value={cooldown} onChange={setCooldown} max={30} />
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Hlavní část: kombinace (až 4 části)</legend>
                {segs.map((sg, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto] gap-2 rounded-2xl bg-surface-2 p-2">
                    <div className="grid grid-cols-3 gap-1">
                      {(['AMRAP', 'EMOM', 'For Time'] as const).map((t) => (
                        <label key={t} className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-1 text-center text-sm font-medium has-[:checked]:bg-ink has-[:checked]:text-bg">
                          <input type="radio" name={`seg${i}`} className="sr-only" checked={sg.type === t} onChange={() => setSegs(segs.map((x, j) => (j === i ? { ...x, type: t } : x)))} />{t}
                        </label>
                      ))}
                    </div>
                    <button type="button" aria-label={`Odebrat část ${i + 1}`} disabled={segs.length < 2} onClick={() => setSegs(segs.filter((_, j) => j !== i))} className="flex size-11 items-center justify-center rounded-lg text-muted hover:bg-surface disabled:opacity-30">✕</button>
                    <div className="col-span-2">
                      <Stepper label={`Část ${i + 1}: délka`} value={sg.minutes} onChange={(v) => setSegs(segs.map((x, j) => (j === i ? { ...x, minutes: v } : x)))} min={1} max={60} />
                    </div>
                  </div>
                ))}
                {segs.length < 4 && <button type="button" onClick={() => setSegs([...segs, { type: 'AMRAP', minutes: '10' }])} className={btn2Cls}>+ Přidat část</button>}
              </fieldset>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <Stepper label="Rozcvička" value={warmup} onChange={setWarmup} max={30} />
              <Stepper label="Hlavní část" value={main} onChange={setMain} min={1} max={90} />
              <Stepper label="Zklidnění" value={cooldown} onChange={setCooldown} max={30} />
            </div>
          )}
          <p className="tnum text-sm text-muted">Celkem <b className="text-ink">{total} min</b>. Nula = blok vynechat.</p>
          {(format === 'Tabata' || format === 'TRX' || (cf && segs.some((x) => x.type === 'For Time'))) && (
            <details className="rounded-xl border border-line p-3">
              <summary className="cursor-pointer text-sm font-medium">Upřesnit časy formátu</summary>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {format !== 'CrossFit' && par('workSec', 'Práce (s)', format === 'Tabata' ? '20' : '40')}
                {format !== 'CrossFit' && par('restSec', format === 'TRX' ? 'Přechod (s)' : 'Pauza (s)', format === 'Tabata' ? '10' : '20')}
                {par('rounds', format === 'Tabata' ? 'Kol na cvik' : 'Kol', format === 'Tabata' ? '8' : '3')}
                {format !== 'CrossFit' && par('pauseSec', format === 'Tabata' ? 'Pauza mezi cviky (s)' : 'Pauza mezi koly (s)', '60')}
              </div>
            </details>
          )}
        </Section>

        <Section n={3} title="Zaměření">
          <ChipGroup label="Svalové partie" hint="Nevybráno = všechny partie.">
            {MUSCLES.map((m) => <Chip key={m} checked={muscles.includes(m)} onChange={() => toggle(muscles, setMuscles, m)}>{m}</Chip>)}
          </ChipGroup>
          <div className="space-y-2">
            <label className="flex items-baseline justify-between text-sm font-medium" htmlFor="ks">
              <span>Kardio ↔ síla</span><b className="text-base">{KS[ks - 1]}</b>
            </label>
            <input id="ks" type="range" min={1} max={5} step={1} value={ks} onChange={(e) => setKs(Number(e.target.value))} className="h-11 w-full accent-ink" />
            <div className="flex justify-between text-xs text-muted"><span>Kardio</span><span>Vyváženě</span><span>Síla</span></div>
          </div>
        </Section>

        <Section n={4} title="Vybavení">
          <ChipGroup label="Dostupné pomůcky" hint="Vlastní váha je vždy k dispozici.">
            {visibleEq.map((o) => <Chip key={o.name} checked={eq.includes(o.name)} onChange={() => toggle(eq, setEq, o.name)}>{eqLabel(o)}</Chip>)}
          </ChipGroup>
          {restored && (
            <p className="text-sm text-muted">Předvyplněno podle posledního tréninku.{' '}
              <button type="button" className="underline" onClick={() => { setEq(format === 'TRX' ? ['TRX'] : []); setRestored(false) }}>Vymazat výběr</button>
            </p>
          )}
        </Section>

        <details className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
          <summary className="cursor-pointer text-lg font-bold">Další údaje <span className="text-sm font-normal text-muted">(nepovinné)</span></summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Field label="Velikost skupiny"><input type="number" inputMode="numeric" min={1} value={groupSize} onChange={(e) => setGroupSize(e.target.value)} className={inputCls} /></Field>
            <Field label="Cílová skupina"><input value={groupName} maxLength={80} onChange={(e) => setGroupName(e.target.value)} className={inputCls} /></Field>
            <Field label="Název tréninku" hint="Jinak se vyplní sám."><input value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></Field>
          </div>
        </details>

        {/* Pevná lišta s hlavní akcí. Na telefonu nad spodní navigací. */}
        <div className="sticky bottom-[4.75rem] z-20 md:bottom-4">
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface/95 p-2.5 shadow-lg backdrop-blur">
            <p className="tnum pl-2 text-sm text-muted"><b className="block text-lg leading-tight text-ink">{total} min</b>celkem</p>
            <button disabled={pending} className={`${btnCls} ml-auto flex-1 sm:flex-none sm:px-8`}>{pending ? 'Generuji…' : workout ? 'Přegenerovat' : 'Vygenerovat trénink'}</button>
          </div>
        </div>
      </form>

      <div ref={resRef} className="scroll-mt-4">
        {genError && <Alert>{genError}</Alert>}
        {workout && (
          <div className="space-y-3">
            <WorkoutEditor workout={workout} onChange={(w) => { setWorkout(w); setDirty(true); setUnsaved(true) }} />
            <SaveBar workout={workout} savedId={savedId} unsaved={unsaved} onSaved={(id) => { setSavedId(id); setUnsaved(false) }} />
            <ExportBar workout={workout} />
            <button type="button" onClick={submit} disabled={pending} className={btn2Cls}>{pending ? 'Generuji…' : 'Přegenerovat se stejným zadáním'}</button>
          </div>
        )}
      </div>
    </div>
  )
}
