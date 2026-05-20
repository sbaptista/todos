'use client'

import { useState, useEffect } from 'react'

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true) // optimistic start

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        // Fetch health endpoint to verify actual internet connectivity
        const res = await fetch('/api/health', { cache: 'no-store' })
        if (!cancelled) setIsOnline(res.ok)
      } catch {
        if (!cancelled) setIsOnline(false)
      }
    }

    check() // immediate check on mount

    // Fallback listeners for quick offline/online OS level notifications
    const goOnline = () => { check() }
    const goOffline = () => { setIsOnline(false) }

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    // Regular interval checking (every 10s)
    const interval = setInterval(check, 10000)

    return () => {
      cancelled = true
      clearInterval(interval)
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return isOnline
}
