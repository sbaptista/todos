import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SettingsSidebar from '@/components/settings/SettingsSidebar'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: currentUser } = await supabase
    .from('users')
    .select('role_id')
    .eq('id', user.id)
    .single()

  const isAdmin = currentUser?.role_id === 1 || currentUser?.role_id === 3

  return (
    <div className="sl-page">
      <div className="sl-topbar">
        <Link href="/dashboard" className="sl-back">← back</Link>
        <span className="sl-title">Settings</span>
      </div>

      <div className="sl-body settings-shell">
        <SettingsSidebar isAdmin={isAdmin} />
        <main className="sl-main">{children}</main>
      </div>
    </div>
  )
}
