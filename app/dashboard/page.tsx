import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AmbientDashboard from '@/components/AmbientDashboard'

type Product = { id: string; name: string; code: string | null; description: string | null; created_by: string }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: currentUser } = await supabase
    .from('users')
    .select('role_id')
    .eq('id', user.id)
    .single()

  const isAdmin = currentUser?.role_id === 1 || currentUser?.role_id === 3

  const { data } = await supabase
    .from('projects')
    .select('id, name, code, description, created_by')
    .order('sort_order')

  return <AmbientDashboard initialProducts={(data ?? []) as Product[]} isAdmin={isAdmin} />
}
