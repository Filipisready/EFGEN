import Link from 'next/link'
import { Card } from '@/components/ui'
import { RegisterForm } from '@/components/auth-forms'

export const metadata = { title: 'Registrace · EFGEN' }

export default function Page() {
  return (
    <Card>
      <h1 className="text-2xl font-bold">Registrace trenéra</h1>
      <RegisterForm />
      <p className="text-center text-sm">Už máte účet? <Link href="/prihlaseni" className="underline">Přihlaste se</Link></p>
    </Card>
  )
}
