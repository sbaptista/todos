'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { assertAdmin } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'
import { headers } from 'next/headers'

export async function inviteUser(email: string, _firstName: string, _lastName: string, _roleId: number) {
  try {
    await assertAdmin()
  } catch (e: any) {
    return { error: e.message }
  }

  // Build the redirect URL from the incoming request's host header
  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3001'
  const origin = `https://${host}`

  const supabase = createAdminClient()

  try {
    // inviteUserByEmail sends a real email and routes the tester through
    // /auth/callback → create-account (where they fill in their own name)
    const { data: authData, error: authErr } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/auth/callback`,
    })

    if (authErr) throw authErr
    if (!authData.user) return { error: 'Failed to send invite' }

    await logAuditEvent({
      action: 'user_invite',
      table_name: 'users',
      record_id: authData.user.id,
      after: { email },
    })

    return { ok: true }
  } catch (err: any) {
    console.error('[inviteUser] Error:', err)
    return { error: err.message }
  }
}

