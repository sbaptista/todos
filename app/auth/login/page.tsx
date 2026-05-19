'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { VERSION } from '@/lib/version'

const isDev = process.env.NODE_ENV === 'development'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!navigator.onLine) {
      setError('You appear to be offline. Check your connection and try again.')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      if (isDev && (email === 'dev@dev.local' || email === 'owner@test.local')) {
        const isOwner = email === 'owner@test.local'
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: isOwner ? 'owner@test.local' : process.env.NEXT_PUBLIC_DEV_EMAIL!,
          password: isOwner ? 'orb123456' : process.env.NEXT_PUBLIC_DEV_PASSWORD!,
        })
        if (signInError) {
          setError(`Dev login failed: ${signInError.message}`)
          setLoading(false)
          return
        }
        if (data.user) {
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', data.user.id)
            .single()
          router.push(existingUser ? '/dashboard' : '/auth/create-account')
        }
        setLoading(false)
        return
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      })

      if (otpError) {
        setError(otpError.message)
      } else {
        router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`)
      }
    } catch (err: any) {
      if (!navigator.onLine || err?.message?.includes('fetch')) {
        setError('You appear to be offline. Check your connection and try again.')
      } else {
        setError(err?.message || 'Something went wrong. Please try again.')
      }
    }

    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Orb</h1>
            <p className="auth-subtitle">Enter your email to receive a verification code</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email" className="auth-label">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="auth-input"
              />
            </div>

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? 'Sending…' : 'Send verification code'}
            </button>
          </form>

          {error && (
            <div className="auth-error">
              <p className="text-sm text-error" style={{ margin: 0 }}>{error}</p>
            </div>
          )}

          {isDev && (
            <div className="auth-dev-banner">
              <p className="text-xs" style={{ color: 'var(--warning)', margin: 0 }}>
                <strong>Dev mode:</strong> use{' '}
                <code className="auth-dev-code" onClick={() => setEmail('dev@dev.local')}>
                  dev@dev.local
                </code>{' '}
                (admin) or{' '}
                <code className="auth-dev-code" onClick={() => setEmail('owner@test.local')}>
                  owner@test.local
                </code>{' '}
                (owner)
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="auth-version">
        <span className="auth-version-text">Orb {VERSION}</span>
      </div>
    </div>
  )
}
