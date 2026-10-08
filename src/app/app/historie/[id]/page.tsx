import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { workoutSchema } from '@/lib/export/workout-schema'
import { duplicateWorkoutAction, deleteWorkoutAction } from '@/lib/workout-actions'
import { SavedWorkout } from '@/components/saved-workout'
import { ConfirmButton } from '@/components/confirm-button'
import { btn2Cls } from '@/components/ui'
import type { GeneratedWorkout } from '@/lib/generator/types'

export const metadata = { title: 'Uložený trénink · EFGEN' }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const { profile } = await requireUser()
  const supabase = await createClient()
  const { data } = await supabase.from('workouts').select('content').eq('id', id).eq('user_id', profile.id).maybeSingle()
  if (!data) notFound()
  const parsed = workoutSchema.safeParse(data.content)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/app/historie" className="text-sm underline">← Zpět na historii</Link>
        <div className="flex flex-wrap items-center gap-3">
          <form action={duplicateWorkoutAction.bind(null, id)}><button className={btn2Cls}>Duplikovat a upravit</button></form>
          <ConfirmButton action={deleteWorkoutAction.bind(null, id)} message="Opravdu smazat tento trénink? Nelze to vrátit." className="text-sm text-red-600 underline">Smazat</ConfirmButton>
        </div>
      </div>
      {parsed.success
        ? <SavedWorkout id={id} initial={parsed.data as GeneratedWorkout} />
        : <p className="text-red-600">Tento trénink se nepodařilo zobrazit (poškozená data).</p>}
    </div>
  )
}
