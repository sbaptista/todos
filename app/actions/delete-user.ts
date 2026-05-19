'use server'

import { requireAdmin } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'

const SUPER_ADMIN_ROLE_ID = 3
const PROTECTED_EMAILS = ['dev@localhost.me', 'owner@test.local']

export async function deleteUsers(userIds: string[]) {
  try {
    await requireAdmin()
  } catch (e: any) {
    return { error: e.message }
  }

  const results = await Promise.all(userIds.map(id => deleteUser(id)))
  const failed = results.filter(r => r.error)
  if (failed.length > 0) return { error: `${failed.length} of ${userIds.length} deletions failed` }
  return { ok: true }
}

export async function deleteUser(userId: string) {
  let ctx
  try {
    ctx = await requireAdmin()
  } catch (e: any) {
    return { error: e.message }
  }

  try {
    const { data: target } = await ctx.admin
      .from('users')
      .select('role_id, email')
      .eq('id', userId)
      .single()

    if (!target) return { error: 'User not found' }
    if (target.role_id === SUPER_ADMIN_ROLE_ID) return { error: 'Cannot delete Super Admin' }
    if (PROTECTED_EMAILS.includes(target.email)) return { error: 'This test user cannot be deleted' }

    const { error: dbError } = await ctx.admin
      .from('users')
      .delete()
      .eq('id', userId)

    if (dbError) throw dbError

    const { error: authError } = await ctx.admin.auth.admin.deleteUser(userId)
    if (authError) {
      console.warn('[deleteUser] Warning: Auth user deletion failed or already deleted:', authError.message)
    }

    await logAuditEvent({
      action: 'user_delete',
      table_name: 'users',
      record_id: userId,
      actor: 'admin-ui',
      user_id: ctx.user.id,
    })

    return { ok: true }
  } catch (err: any) {
    console.error('[deleteUser] Error:', err)
    return { error: err.message }
  }
}
