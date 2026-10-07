import Link from 'next/link'
import { Alert, Card } from '@/components/ui'
import { LoginForm } from '@/components/auth-forms'

export const metadata = { title: 'Přihlášení · EFGEN' }

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; chyba?: string }> }) {
  const { next, chyba } = await searchParams
  return (
    <Card>
      <h1 className="text-2xl font-bold">Přihlášení</h1>
      {chyba && <Alert>Odkaz je neplatný nebo vypršel. Přihlaste se, případně si nechte poslat nový.</Alert>}
      <LoginForm next={next} />
      <p className="text-center text-sm">Nemáte účet? <Link href="/registrace" className="underline">Zaregistrujte se</Link></p>
    </Card>
  )
}
