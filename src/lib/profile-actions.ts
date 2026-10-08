'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'

export type ProfileState = { error?: string; ok?: string }

export async function updateProfileAction(_: ProfileState, fd: FormData): Promise<ProfileState> {
  const { profile } = await requireUser()
  const parsed = z.string().trim().max(60, 'Jméno je příliš dlouhé.').safeParse(fd.get('display_name') ?? '')
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ display_name: parsed.data || null }).eq('id', profile.id)
  if (error) return { error: 'Uložení se nepovedlo.' }
  revalidatePath('/app', 'layout')
  return { ok: 'Uloženo.' }
}

export async function changePasswordAction(_: ProfileState, fd: FormData): Promise<ProfileState> {
  await requireUser()
  const p = z.string().min(8, 'Heslo musí mít alespoň 8 znaků.').max(72, 'Heslo je příliš dlouhé.').safeParse(fd.get('password'))
  if (!p.success) return { error: p.error.issues[0].message }
  if (fd.get('password') !== fd.get('password2')) return { error: 'Hesla se neshodují.' }
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: p.data })
  if (error) return { error: error.message.toLowerCase().includes('different') ? 'Nové heslo musí být jiné než staré.' : 'Heslo se nepodařilo změnit.' }
  return { ok: 'Heslo bylo změněno.' }
}
