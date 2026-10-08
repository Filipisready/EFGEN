import { Card } from '@/components/ui'
import { ForgotForm } from '@/components/auth-forms'

export const metadata = { title: 'Zapomenuté heslo · EFGEN' }

export default function Page() {
  return (
    <Card>
      <h1 className="text-2xl font-bold">Zapomenuté heslo</h1>
      <p className="text-sm text-muted">Zadejte e-mail, se kterým jste se registrovali. Pošleme vám odkaz pro nastavení nového hesla.</p>
      <ForgotForm />
    </Card>
  )
}
