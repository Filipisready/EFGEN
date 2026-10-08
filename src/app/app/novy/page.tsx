import { createClient } from '@/lib/supabase/server'
import { GeneratorForm } from '@/components/generator-form'

export const metadata = { title: 'Nový trénink · EFGEN' }

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('equipment').select('name,cf_label,formats').order('name')
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Nový trénink</h1>
      <GeneratorForm equipment={(data ?? []).filter((e) => e.name !== 'vlastní váha')} />
    </div>
  )
}
