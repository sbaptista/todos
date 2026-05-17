'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { assertAdmin } from '@/lib/auth'

export async function updateUserStage(
  targetUserId: string,
  stage: 'pre-alpha' | 'alpha' | 'beta' | null
) {
  try {
    await assertAdmin()
  } catch (e: any) {
    return { error: e.message as string }
  }

  const admin = createAdminClient()

  // Fetch current program_joined_at so we only set it once (never clear it)
  const { data: current } = await admin
    .from('users')
    .select('program_joined_at')
    .eq('id', targetUserId)
    .single()

  const updates: Record<string, any> = { release_stage: stage }

  // Set program_joined_at the first time a stage is assigned; never overwrite
  if (stage !== null && !current?.program_joined_at) {
    updates.program_joined_at = new Date().toISOString()
  }

  const { error } = await admin
    .from('users')
    .update(updates)
    .eq('id', targetUserId)

  if (error) return { error: error.message }
  return { success: true }
}
