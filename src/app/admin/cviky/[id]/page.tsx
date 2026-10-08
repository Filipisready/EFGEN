import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteExercise } from '@/lib/exercise-actions'
import { ExerciseForm } from '@/components/exercise-form'
import { ConfirmButton } from '@/components/confirm-button'
import type { Exercise } from '@/lib/constants'

export const metadata = { title: 'Úprava cviku · EFGEN' }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const supabase = await createClient()
  const [{ data: exercise }, { data: eq }] = await Promise.all([
    supabase.from('exercises').select('*').eq('id', id).maybeSingle<Exercise>(),
    supabase.from('equipment').select('name').order('name'),
  ])
  if (!exercise) notFound()
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{exercise.name}</h1>
        <ConfirmButton action={deleteExercise.bind(null, id)} message={`Opravdu smazat cvik „${exercise.name}“? Uložené tréninky zůstanou beze změny.`} className="text-sm text-danger underline">Smazat cvik</ConfirmButton>
      </div>
      <ExerciseForm exercise={exercise} equipment={(eq ?? []).map((e) => e.name)} />
    </div>
  )
}
