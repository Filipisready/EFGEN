import { Alert } from '@/components/ui'
import { AuthLayout } from '@/components/auth-layout'
import { LoginForm } from '@/components/auth-forms'

export const metadata = { title: 'Přihlášení · EFGEN' }

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; chyba?: string }> }) {
  const { next, chyba } = await searchParams
  return (
    <AuthLayout active="login">
      <p className="text-sm text-muted">Už máte účet? Přihlaste se e-mailem a heslem.</p>
      {chyba && <Alert>Odkaz je neplatný nebo vypršel. Přihlaste se, případně si nechte poslat nový.</Alert>}
      <LoginForm next={next} />
    </AuthLayout>
  )
}
