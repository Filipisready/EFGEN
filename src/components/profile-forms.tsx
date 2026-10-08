'use client'
import { useActionState } from 'react'
import { changePasswordAction, updateProfileAction, type ProfileState } from '@/lib/profile-actions'
import { Alert, Field, btnCls, inputCls } from '@/components/ui'

const init: ProfileState = {}

export function NameForm({ name }: { name: string }) {
  const [s, action, pending] = useActionState(updateProfileAction, init)
  return (
    <form action={action} className="space-y-3">
      {s.error && <Alert>{s.error}</Alert>}{s.ok && <Alert kind="ok">{s.ok}</Alert>}
      <Field label="Zobrazované jméno" hint="Nepovinné. Zobrazí se v aplikaci."><input name="display_name" defaultValue={name} maxLength={60} className={inputCls} /></Field>
      <button disabled={pending} className={btnCls}>{pending ? 'Ukládám…' : 'Uložit jméno'}</button>
    </form>
  )
}

export function PasswordForm() {
  const [s, action, pending] = useActionState(changePasswordAction, init)
  return (
    <form action={action} className="space-y-3">
      {s.error && <Alert>{s.error}</Alert>}{s.ok && <Alert kind="ok">{s.ok}</Alert>}
      <Field label="Nové heslo" hint="Alespoň 8 znaků."><input name="password" type="password" autoComplete="new-password" minLength={8} required className={inputCls} /></Field>
      <Field label="Nové heslo znovu"><input name="password2" type="password" autoComplete="new-password" minLength={8} required className={inputCls} /></Field>
      <button disabled={pending} className={btnCls}>{pending ? 'Ukládám…' : 'Změnit heslo'}</button>
    </form>
  )
}
