'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function VerifyOtpContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Check if user exists in our users table
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!existingUser) {
          router.push('/auth/create-account')
        } else {
          router.push('/dashboard')
        }
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-zinc-900">Verify your email</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Enter the 8-digit code sent to<br />
              <span className="font-medium text-zinc-700">{email}</span>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-zinc-700 mb-1.5">
                Verification code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                placeholder="12345678"
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400 text-center text-2xl tracking-[0.3em] font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 8}
              className="w-full bg-zinc-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>

            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700 text-center">
                <strong>Dev mode:</strong> Enter <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">87654321</code> to bypass OTP
              </p>
            </div>
          </form>

          {error && (
            <div className="mt-5 p-3.5 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/auth/login')}
            className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer bg-transparent border-none"
          >
            ← Back to login
          </button>
        </div>

          <p className="mt-6 text-center text-xs text-zinc-400">
            TODOS v0.2.13
          </p>
      </div>
    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-400">Loading...</div>}>
      <VerifyOtpContent />
    </Suspense>
  )
}
