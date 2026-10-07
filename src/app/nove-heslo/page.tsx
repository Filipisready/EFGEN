import { Card } from '@/components/ui'
import { NewPasswordForm } from '@/components/auth-forms'
import { requireUser } from '@/lib/auth'

export const metadata = { title: 'Nové heslo · EFGEN' }

export default async function Page() {
  await requireUser() // sem se uživatel dostane jen přes odkaz z e-mailu
  return (
    <Card>
      <h1 className="text-2xl font-bold">Nové heslo</h1>
      <NewPasswordForm />
    </Card>
  )
}
