import { requireAdmin } from '@/lib/auth'
import { Shell } from '@/components/shell'
import { AdminTabs } from '@/components/admin-tabs'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin()
  return <Shell profile={profile}><AdminTabs />{children}</Shell>
}
