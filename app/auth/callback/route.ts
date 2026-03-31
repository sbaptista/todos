import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if this user already has a row in our users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existingUser) {
        // New user — send to create-account to collect first + last name
        return NextResponse.redirect(`${origin}/auth/create-account`)
      }

      // Known user — send to dashboard
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Something went wrong — back to login
  return NextResponse.redirect(`${origin}/auth/login`)
}
