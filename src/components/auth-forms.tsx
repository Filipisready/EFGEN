'use client'
import Link from 'next/link'
import { useActionState } from 'react'
import { login, register, forgotPassword, setNewPassword, type FormState } from '@/lib/auth-actions'
import { Alert, Field, btnCls, inputCls } from '@/components/ui'

const init: FormState = {}

function Msg({ s }: { s: FormState }) {
  return (<>{s.error && <Alert>{s.error}</Alert>}{s.ok && <Alert kind="ok">{s.ok}</Alert>}</>)
}

export function LoginForm({ next }: { next?: string }) {
  const [s, action, pending] = useActionState(login, init)
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ''} />
      <Msg s={s} />
      <Field label="E-mail"><input name="email" type="email" autoComplete="email" required className={inputCls} /></Field>
      <Field label="Heslo"><input name="password" type="password" autoComplete="current-password" required className={inputCls} /></Field>
      <button disabled={pending} className={`${btnCls} w-full`}>{pending ? 'Přihlašuji…' : 'Přihlásit se'}</button>
      <p className="text-center text-sm"><Link href="/zapomenute-heslo" className="underline">Zapomenuté heslo</Link></p>
    </form>
  )
}

export function RegisterForm() {
  const [s, action, pending] = useActionState(register, init)
  if (s.ok) return <Alert kind="ok">{s.ok}</Alert>
  return (
    <form action={action} className="space-y-4">
      <Msg s={s} />
      <Field label="E-mail"><input name="email" type="email" autoComplete="email" required className={inputCls} /></Field>
      <Field label="Heslo" hint="Alespoň 8 znaků."><input name="password" type="password" autoComplete="new-password" minLength={8} required className={inputCls} /></Field>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent" className="mt-1 size-5" required />
        <span>Souhlasím se <Link href="/zasady-ochrany-soukromi" target="_blank" className="underline">zásadami ochrany soukromí</Link>.</span>
      </label>
      <button disabled={pending} className={`${btnCls} w-full`}>{pending ? 'Zakládám účet…' : 'Vytvořit účet'}</button>
    </form>
  )
}

export function ForgotForm() {
  const [s, action, pending] = useActionState(forgotPassword, init)
  return (
    <form action={action} className="space-y-4">
      <Msg s={s} />
      <Field label="E-mail"><input name="email" type="email" autoComplete="email" required className={inputCls} /></Field>
      <button disabled={pending} className={`${btnCls} w-full`}>{pending ? 'Odesílám…' : 'Poslat odkaz'}</button>
    </form>
  )
}

export function NewPasswordForm() {
  const [s, action, pending] = useActionState(setNewPassword, init)
  return (
    <form action={action} className="space-y-4">
      <Msg s={s} />
      <Field label="Nové heslo" hint="Alespoň 8 znaků."><input name="password" type="password" autoComplete="new-password" minLength={8} required className={inputCls} /></Field>
      <Field label="Nové heslo znovu"><input name="password2" type="password" autoComplete="new-password" minLength={8} required className={inputCls} /></Field>
      <button disabled={pending} className={`${btnCls} w-full`}>{pending ? 'Ukládám…' : 'Uložit heslo'}</button>
    </form>
  )
}
