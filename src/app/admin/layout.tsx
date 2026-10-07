import { requireAdmin } from '@/lib/auth'
import { Shell } from '@/components/shell'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin()
  return <Shell profile={profile}>{children}</Shell>
}
