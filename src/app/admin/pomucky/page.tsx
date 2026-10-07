import { createClient } from '@/lib/supabase/server'
import { addEquipment, deleteEquipment } from '@/lib/exercise-actions'
import { Alert, Field, btnCls, inputCls } from '@/components/ui'
import { ConfirmButton } from '@/components/confirm-button'

export const metadata = { title: 'Pomůcky · EFGEN' }

export default async function Page({ searchParams }: { searchParams: Promise<{ chyba?: string }> }) {
  const { chyba } = await searchParams
  const supabase = await createClient()
  const { data } = await supabase.from('equipment').select('name,note').order('name')
  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold">Pomůcky</h1>
      <p className="text-sm text-neutral-500">Číselník pomůcek pro cviky. „Vlastní váha“ se neuvádí, znamená žádnou pomůcku. Podložka není pomůcka.</p>
      {chyba && <Alert>{chyba}</Alert>}
      <form action={addEquipment} className="grid gap-3 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end">
        <Field label="Název"><input name="name" required className={inputCls} /></Field>
        <Field label="Poznámka"><input name="note" className={inputCls} /></Field>
        <button className={btnCls}>Přidat</button>
      </form>
      <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {(data ?? []).map((e) => (
          <li key={e.name} className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1"><span className="font-medium">{e.name}</span>{e.note && <span className="block text-sm text-neutral-500">{e.note}</span>}</div>
            <ConfirmButton action={deleteEquipment.bind(null, e.name)} message={`Smazat pomůcku „${e.name}“?`} className="text-sm text-red-600 underline">Smazat</ConfirmButton>
          </li>
        ))}
      </ul>
    </div>
  )
}
