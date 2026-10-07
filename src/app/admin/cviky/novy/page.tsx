import { createClient } from '@/lib/supabase/server'
import { ExerciseForm } from '@/components/exercise-form'

export const metadata = { title: 'Nový cvik · EFGEN' }

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('equipment').select('name').order('name')
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Nový cvik</h1>
      <ExerciseForm equipment={(data ?? []).map((e) => e.name)} />
    </div>
  )
}
