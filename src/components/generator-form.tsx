'use client'
import { useEffect, useRef, useState, useTransition } from 'react'
import { generateAction } from '@/lib/generator-actions'
import type { GeneratedWorkout, GeneratorInput } from '@/lib/generator/types'
import { WorkoutEditor } from '@/components/workout-editor'
import { Alert, Field, btnCls, btn2Cls, inputCls } from '@/components/ui'

const MUSCLES = ['nohy', 'záda', 'core', 'hrudník', 'ramena', 'paže']
const KS = ['Kardio', 'Spíše kardio', 'Vyváženě', 'Spíše síla', 'Síla']
const STORE = 'efgen.generator.v1'

function Chip({ checked, onChange, children, type = 'checkbox', name }: { checked: boolean; onChange: () => void; children: React.ReactNode; type?: 'checkbox' | 'radio'; name?: string }) {
  return (
    <label className={`flex min-h-11 cursor-pointer items-center rounded-lg border px-4 text-base select-none ${checked ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900' : 'border-neutral-300 dark:border-neutral-700'}`}>
      <input type={type} name={name} checked={checked} onChange={onChange} className="sr-only" />
      {children}
    </label>
  )
}

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
      if (r.ok) { setWorkout(r.workout); setGenError(null); setDirty(false) } else { setGenError(r.error); setWorkout(null) }
      setTimeout(() => resRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    })
  }

  const group = (label: string, children: React.ReactNode) => (
    <fieldset className="space-y-2"><legend className="text-sm font-medium">{label}</legend><div className="flex flex-wrap gap-2">{children}</div></fieldset>
  )
  const time = (label: string, v: string, set: (s: string) => void, max: number) => (
    <Field label={label}><input type="number" inputMode="numeric" min={0} max={max} value={v} onChange={(e) => set(e.target.value)} className={inputCls} /></Field>
  )
  const par = (k: keyof typeof params, label: string, ph: string) => (
    <Field label={label}><input type="number" inputMode="numeric" min={0} value={params[k]} placeholder={ph} onChange={(e) => setParams({ ...params, [k]: e.target.value })} className={inputCls} /></Field>
  )

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => { e.preventDefault(); submit() }} className="max-w-2xl space-y-6">
        {group('Úroveň skupiny', (['začátečník', 'pokročilý', 'expert'] as const).map((l) => <Chip key={l} type="radio" name="level" checked={level === l} onChange={() => setLevel(l)}>{l}</Chip>))}
        {group('Prostředí', (['uvnitř', 'venku'] as const).map((l) => <Chip key={l} type="radio" name="env" checked={environment === l} onChange={() => setEnvironment(l)}>{l}</Chip>))}
        {group('Formát', (['Tabata', 'TRX', 'CrossFit'] as const).map((l) => <Chip key={l} type="radio" name="format" checked={format === l} onChange={() => pickFormat(l)}>{l}</Chip>))}

        <div className="space-y-3">
          {cf ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                {time('Rozcvička (min)', warmup, setWarmup, 30)}
                {time('Zklidnění (min)', cooldown, setCooldown, 30)}
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Hlavní část: kombinace (až 4 části)</legend>
                {segs.map((sg, i) => (
                  <div key={i} className="grid grid-cols-[1fr_6rem_auto] items-center gap-2">
                    <select aria-label={`Typ části ${i + 1}`} value={sg.type} onChange={(e) => setSegs(segs.map((x, j) => (j === i ? { ...x, type: e.target.value as Seg['type'] } : x)))} className={inputCls}>
                      {(['AMRAP', 'EMOM', 'For Time'] as const).map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <input aria-label={`Minuty části ${i + 1}`} type="number" inputMode="numeric" min={1} max={60} value={sg.minutes} onChange={(e) => setSegs(segs.map((x, j) => (j === i ? { ...x, minutes: e.target.value } : x)))} className={inputCls} />
                    <button type="button" aria-label={`Odebrat část ${i + 1}`} disabled={segs.length < 2} onClick={() => setSegs(segs.filter((_, j) => j !== i))} className="min-h-11 rounded-lg border border-neutral-300 px-3 disabled:opacity-30 dark:border-neutral-700">✕</button>
                  </div>
                ))}
                {segs.length < 4 && <button type="button" onClick={() => setSegs([...segs, { type: 'AMRAP', minutes: '10' }])} className={btn2Cls}>+ Přidat část</button>}
              </fieldset>
            </>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {time('Rozcvička (min)', warmup, setWarmup, 30)}
              {time('Hlavní část (min)', main, setMain, 90)}
              {time('Zklidnění (min)', cooldown, setCooldown, 30)}
            </div>
          )}
          <p className="text-sm text-neutral-500">Celkem {total} min. Nula = blok vynechat.</p>
        </div>

        {group('Svalové partie (nevybráno = všechny)', MUSCLES.map((m) => <Chip key={m} checked={muscles.includes(m)} onChange={() => toggle(muscles, setMuscles, m)}>{m}</Chip>))}
        <div className="space-y-2">
          {group('Dostupné pomůcky (vlastní váha je vždy k dispozici)', visibleEq.map((o) => <Chip key={o.name} checked={eq.includes(o.name)} onChange={() => toggle(eq, setEq, o.name)}>{eqLabel(o)}</Chip>))}
          {restored && (
            <p className="text-sm text-neutral-500">Předvyplněno podle posledního tréninku.{' '}
              <button type="button" className="underline" onClick={() => { setEq(format === 'TRX' ? ['TRX'] : []); setRestored(false) }}>Vymazat výběr</button>
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="ks">Kardio ↔ síla: <b>{KS[ks - 1]}</b></label>
          <input id="ks" type="range" min={1} max={5} step={1} value={ks} onChange={(e) => setKs(Number(e.target.value))} className="h-11 w-full" />
          <div className="flex justify-between text-xs text-neutral-500"><span>Kardio</span><span>Vyváženě</span><span>Síla</span></div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Velikost skupiny" hint="Nepovinné."><input type="number" inputMode="numeric" min={1} value={groupSize} onChange={(e) => setGroupSize(e.target.value)} className={inputCls} /></Field>
          <Field label="Cílová skupina" hint="Nepovinné."><input value={groupName} maxLength={80} onChange={(e) => setGroupName(e.target.value)} className={inputCls} /></Field>
          <Field label="Název tréninku" hint="Jinak se vyplní sám."><input value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></Field>
        </div>

        {(format === 'Tabata' || format === 'TRX' || (cf && segs.some((x) => x.type === 'For Time'))) && (
          <details className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
            <summary className="cursor-pointer text-sm font-medium">Upřesnit časy formátu</summary>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {format !== 'CrossFit' && par('workSec', 'Práce (s)', format === 'Tabata' ? '20' : '40')}
              {format !== 'CrossFit' && par('restSec', format === 'TRX' ? 'Přechod (s)' : 'Pauza (s)', format === 'Tabata' ? '10' : '20')}
              {par('rounds', format === 'Tabata' ? 'Kol na cvik' : 'Kol', format === 'Tabata' ? '8' : '3')}
              {format !== 'CrossFit' && par('pauseSec', format === 'Tabata' ? 'Pauza mezi cviky (s)' : 'Pauza mezi koly (s)', '60')}
            </div>
          </details>
        )}

        <button disabled={pending} className={`${btnCls} w-full sm:w-auto`}>{pending ? 'Generuji…' : workout ? 'Přegenerovat' : 'Vygenerovat trénink'}</button>
      </form>

      <div ref={resRef} className="scroll-mt-4">
        {genError && <Alert>{genError}</Alert>}
        {workout && (
          <div className="space-y-3">
            <WorkoutEditor workout={workout} onChange={(w) => { setWorkout(w); setDirty(true) }} />
            <button type="button" onClick={submit} disabled={pending} className={btn2Cls}>{pending ? 'Generuji…' : 'Přegenerovat se stejným zadáním'}</button>
          </div>
        )}
      </div>
    </div>
  )
}
