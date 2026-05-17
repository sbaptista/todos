'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { assertAdmin } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'

const SUPER_ADMIN_ROLE_ID = 3
const PROTECTED_EMAILS = ['dev@localhost.me', 'owner@test.local']

export async function deleteUser(userId: string) {
  try {
    await assertAdmin()
  } catch (e: any) {
    return { error: e.message }
  }

  const supabase = createAdminClient()

  try {
    const { data: target } = await supabase
      .from('users')
      .select('role_id, email')
      .eq('id', userId)
      .single()

    if (!target) return { error: 'User not found' }
    if (target.role_id === SUPER_ADMIN_ROLE_ID) return { error: 'Cannot delete Super Admin' }
    if (PROTECTED_EMAILS.includes(target.email)) return { error: 'This test user cannot be deleted' }

    // Delete from public.users table
    const { error: dbError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (dbError) throw dbError

    // Also delete from Supabase Auth so they can be re-invited cleanly
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError) {
      console.warn('[deleteUser] Warning: Auth user deletion failed or already deleted:', authError.message)
    }

    await logAuditEvent({
      action: 'user_delete',
      table_name: 'users',
      record_id: userId,
    })

    return { ok: true }
  } catch (err: any) {
    console.error('[deleteUser] Error:', err)
    return { error: err.message }
  }
}
