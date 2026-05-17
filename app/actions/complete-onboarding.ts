'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function completeOnboarding(firstName: string, lastName: string) {
  try {
    // 1. Verify the user is authenticated via their session cookie
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Session expired or not authenticated. Please sign in again.' }
    }

    const email = user.email
    const id = user.id

    if (!email) {
      return { error: 'User email not found in session.' }
    }

    // 2. Use Admin Client to bypass RLS and perform cleanup + upsert
    const adminSupabase = createAdminClient()

    // Clean up any stale ghost DB rows that have this email but a different ID
    const { error: deleteError } = await adminSupabase
      .from('users')
      .delete()
      .eq('email', email)
      .neq('id', id)

    if (deleteError) {
      console.error('[completeOnboarding] Stale cleanup failed:', deleteError)
      return { error: deleteError.message }
    }

    // Upsert the new user record
    const { error: upsertError } = await adminSupabase
      .from('users')
      .upsert({
        id,
        email,
        first_name: firstName,
        last_name: lastName,
      })

    if (upsertError) {
      console.error('[completeOnboarding] Upsert failed:', upsertError)
      return { error: upsertError.message }
    }

    return { ok: true }
  } catch (err: any) {
    console.error('[completeOnboarding] Unexpected error:', err)
    return { error: err.message || 'An unexpected error occurred.' }
  }
}
