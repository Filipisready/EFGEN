'use client'
import Link from 'next/link'
import { useActionState } from 'react'
import { saveExercise, type ExerciseState } from '@/lib/exercise-actions'
import { Alert, Field, btnCls, btn2Cls, inputCls } from '@/components/ui'
import { BLOCKS, ENVIRONMENTS, FORMATS, LEVELS, MOVEMENTS, MUSCLES, UNITS, type Exercise } from '@/lib/constants'

const KS = ['1 – kardio', '2 – spíše kardio', '3 – vyváženě', '4 – spíše síla', '5 – síla']

export function ExerciseForm({ exercise, equipment }: { exercise?: Exercise; equipment: string[] }) {
  const [state, action, pending] = useActionState<ExerciseState, FormData>(saveExercise.bind(null, exercise?.id ?? null), {})
  const val = (k: keyof Exercise & string, fallback = '') => {
    const v = state.values?.[k]
    if (typeof v === 'string') return v
    const e = exercise?.[k as keyof Exercise]
    return e == null ? fallback : String(e)
  }
  const list = (k: 'equipment' | 'formats' | 'blocks') => {
    const v = state.values?.[k]
    return Array.isArray(v) ? v : state.values ? [] : exercise?.[k] ?? []
  }
  const checkGroup = (name: 'equipment' | 'formats' | 'blocks', opts: readonly string[]) => (
    <div className="flex flex-wrap gap-2">
      {opts.map((o) => (
        <label key={o} className="flex min-h-11 items-center gap-2 rounded-lg border border-line-strong px-3">
          <input type="checkbox" name={name} value={o} defaultChecked={list(name).includes(o)} className="size-5" />
          <span className="text-sm">{o}</span>
        </label>
      ))}
    </div>
  )
  const select = (name: string, opts: readonly string[], placeholder?: string) => (
    <select name={name} defaultValue={val(name as keyof Exercise & string)} className={inputCls} required>
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
  const activeDefault = state.values ? state.values.active === 'on' : exercise?.active ?? true

  return (
    <form action={action} className="max-w-2xl space-y-5">
      {state.error && <Alert>{state.error}</Alert>}
      <Field label="Název *"><input name="name" defaultValue={val('name')} required className={inputCls} /></Field>
      <Field label="Alternativní název" hint="Např. anglický pojem."><input name="alt_name" defaultValue={val('alt_name')} className={inputCls} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Svalová partie *">{select('muscle', MUSCLES, 'Vyberte…')}</Field>
        <Field label="Úroveň *">{select('level', LEVELS, 'Vyberte…')}</Field>
        <Field label="Prostředí *">{select('environment', ENVIRONMENTS, 'Vyberte…')}</Field>
        <Field label="Pohybový vzorec *">{select('movement', MOVEMENTS, 'Vyberte…')}</Field>
      </div>
      <div className="space-y-1.5"><span className="text-sm font-medium">Formáty *</span>{checkGroup('formats', FORMATS)}</div>
      <div className="space-y-1.5"><span className="text-sm font-medium">Bloky *</span>{checkGroup('blocks', BLOCKS)}</div>
      <div className="space-y-1.5">
        <span className="text-sm font-medium">Pomůcky</span>
        <p className="text-sm text-muted">Nic nezaškrtávejte, pokud cvik nepotřebuje vybavení (vlastní váha).</p>
        {checkGroup('equipment', equipment)}
      </div>
      <Field label="Kardio ↔ síla *">
        <select name="cardio_strength" defaultValue={val('cardio_strength', '3')} className={inputCls}>
          {KS.map((l, i) => <option key={i} value={i + 1}>{l}</option>)}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Výchozí hodnota" hint="Např. 12 opakování, 30 sekund, 20 metrů."><input name="default_value" type="number" min={1} defaultValue={val('default_value')} className={inputCls} /></Field>
        <Field label="Jednotka *">{select('unit', UNITS)}</Field>
      </div>
      <Field label="Popis provedení *" hint="1 až 3 věty, rozkaz, co nejstručněji."><textarea name="description" defaultValue={val('description')} rows={3} required className={inputCls} /></Field>
      <Field label="Odkaz na video" hint="Nepovinné, musí začínat https://"><input name="video_url" type="url" defaultValue={val('video_url')} className={inputCls} /></Field>
      <label className="flex items-center gap-3"><input type="checkbox" name="active" defaultChecked={activeDefault} className="size-5" /><span>Aktivní (nabízí se generátoru)</span></label>
      <div className="flex gap-3">
        <button disabled={pending} className={btnCls}>{pending ? 'Ukládám…' : 'Uložit'}</button>
        <Link href="/admin/cviky" className={btn2Cls}>Zrušit</Link>
      </div>
    </form>
  )
}
