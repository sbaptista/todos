'use client'

import { useState, useEffect } from 'react'

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    function goOffline() { setOffline(true) }
    function goOnline() { setOffline(false) }

    if (!navigator.onLine) setOffline(true)

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 99999,
      padding: '10px 16px',
      background: 'var(--warning, #c57600)',
      color: '#fff',
      textAlign: 'center',
      fontSize: '14px',
      fontWeight: 500,
      letterSpacing: '0.01em',
    }}>
      You appear to be offline. Some features may not work until your connection is restored.
    </div>
  )
}
