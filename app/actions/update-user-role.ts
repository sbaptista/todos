'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { assertAdmin, getSessionRole } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'

const SUPER_ADMIN_ROLE_ID = 3

export async function updateUserRole(userId: string, roleId: number) {
  try {
    await assertAdmin()
  } catch (e: any) {
    return { error: e.message }
  }

  const supabase = createAdminClient()

  try {
    // Check if target is a Super Admin — immutable
    const { data: target } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', userId)
      .single()

    if (target?.role_id === SUPER_ADMIN_ROLE_ID) {
      return { error: 'Cannot change role of Super Admin' }
    }

    const { error } = await supabase
      .from('users')
      .update({ role_id: roleId })
      .eq('id', userId)

    if (error) throw error

    await logAuditEvent({
      action: 'user_role_update',
      table_name: 'users',
      record_id: userId,
      after: { role_id: roleId },
    })

    return { ok: true }
  } catch (err: any) {
    console.error('[updateUserRole] Error:', err)
    return { error: err.message }
  }
}
