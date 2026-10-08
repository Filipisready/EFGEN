'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

/** Smazání uživatele i s jeho tréninky na vyžádání (PRD FR-16, zásady ochrany soukromí). */
export async function deleteUserAction(userId: string) {
  const { profile } = await requireAdmin()
  if (!/^[0-9a-f-]{36}$/i.test(userId) || userId === profile.id) redirect('/admin/uzivatele?chyba=' + encodeURIComponent('Tohoto uživatele nelze smazat.'))
  const { error } = await createAdminClient().auth.admin.deleteUser(userId) // profil a tréninky se smažou kaskádově
  if (error) redirect('/admin/uzivatele?chyba=' + encodeURIComponent('Smazání se nepovedlo.'))
  revalidatePath('/admin/uzivatele')
  redirect('/admin/uzivatele?ok=1')
}
