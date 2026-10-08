import { AuthLayout } from '@/components/auth-layout'
import { RegisterForm } from '@/components/auth-forms'

export const metadata = { title: 'Registrace · EFGEN' }

export default function Page() {
  return (
    <AuthLayout active="register">
      <p className="text-sm text-muted">Nový trenér? Účet je zdarma. Na zadaný e-mail pošleme odkaz pro ověření adresy.</p>
      <RegisterForm />
    </AuthLayout>
  )
}
