import { createClient } from '@/lib/supabase/server'
import { addEquipment, deleteEquipment, updateEquipment } from '@/lib/exercise-actions'
import { Alert, Field, btnCls, btn2Cls, inputCls } from '@/components/ui'
import { ConfirmButton } from '@/components/confirm-button'
import { FORMATS } from '@/lib/constants'

export const metadata = { title: 'Pomůcky · EFGEN' }

type Eq = { name: string; note: string | null; cf_label: string | null; formats: string[] }

function Formats({ checked }: { checked: string[] }) {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      {FORMATS.map((f) => (
        <label key={f} className="flex min-h-11 items-center gap-2"><input type="checkbox" name="formats" value={f} defaultChecked={checked.includes(f)} className="size-5" />{f}</label>
      ))}
    </div>
  )
}

export default async function Page({ searchParams }: { searchParams: Promise<{ chyba?: string }> }) {
  const { chyba } = await searchParams
  const supabase = await createClient()
  const { data } = await supabase.from('equipment').select('name,note,cf_label,formats').order('name').returns<Eq[]>()
  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold">Pomůcky</h1>
      <p className="text-sm text-muted">Číselník pomůcek pro cviky. „Vlastní váha“ se neuvádí, znamená žádnou pomůcku. Podložka není pomůcka. Pomůcka se nabízí jen u zaškrtnutých formátů, v CrossFitu se zobrazuje pod anglickým názvem (pokud je zadaný).</p>
      {chyba && <Alert>{chyba}</Alert>}
      <form action={addEquipment} className="space-y-3 rounded-lg border border-line p-3">
        <h2 className="font-semibold">Nová pomůcka</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Název"><input name="name" required className={inputCls} /></Field>
          <Field label="Název v CrossFitu" hint="Např. dumbbell."><input name="cf_label" className={inputCls} /></Field>
          <Field label="Poznámka"><input name="note" className={inputCls} /></Field>
        </div>
        <Formats checked={[...FORMATS]} />
        <button className={btnCls}>Přidat</button>
      </form>
      <ul className="divide-y divide-line rounded-lg border border-line">
        {(data ?? []).map((e) => (
          <li key={e.name} className="space-y-2 p-3">
            <div className="flex items-center gap-3">
              <span className="min-w-0 flex-1 font-medium">{e.name}{e.cf_label && <span className="ml-2 text-sm font-normal text-muted">CrossFit: {e.cf_label}</span>}</span>
              <ConfirmButton action={deleteEquipment.bind(null, e.name)} message={`Smazat pomůcku „${e.name}“?`} className="text-sm text-danger underline">Smazat</ConfirmButton>
            </div>
            <details>
              <summary className="cursor-pointer text-sm underline">Upravit</summary>
              <form action={updateEquipment.bind(null, e.name)} className="mt-3 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Název v CrossFitu"><input name="cf_label" defaultValue={e.cf_label ?? ''} className={inputCls} /></Field>
                  <Field label="Poznámka"><input name="note" defaultValue={e.note ?? ''} className={inputCls} /></Field>
                </div>
                <Formats checked={e.formats} />
                <button className={btn2Cls}>Uložit</button>
              </form>
            </details>
          </li>
        ))}
      </ul>
    </div>
  )
}
