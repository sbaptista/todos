'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const supabase = createClient()

    if (process.env.NODE_ENV === 'development' && email === 'dev@dev.local') {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: process.env.NEXT_PUBLIC_DEV_EMAIL!,
        password: process.env.NEXT_PUBLIC_DEV_PASSWORD!,
      })
      if (signInError) {
        setError(signInError.message)
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

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Check your email for the verification code.')
      router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-zinc-900">Sign in to TODOS</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Enter your email to receive a verification code
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {loading ? 'Sending…' : 'Send verification code'}
            </button>
          </form>

          {message && (
            <div className="mt-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-sm text-emerald-700">{message}</p>
            </div>
          )}

          {error && (
            <div className="mt-5 p-3.5 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700 text-center">
              <strong>Dev mode:</strong> Use email <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">dev@dev.local</code> to bypass email sending
            </p>
          </div>
        </div>

          <p className="mt-6 text-center text-xs text-zinc-400">
            TODOS v0.2.13
          </p>
      </div>
    </div>
  )
}
