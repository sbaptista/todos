import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single()

  return (
    <main style={{ maxWidth: 600, margin: '100px auto', padding: '0 24px' }}>
      <h1>Dashboard</h1>
      {profile && (
        <p>Welcome, {profile.first_name} {profile.last_name}.</p>
      )}
      <p>Coming soon.</p>
    </main>
  )
}
