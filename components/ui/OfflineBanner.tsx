'use client'

import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import OfflinePage from '@/components/ui/OfflinePage'

export default function OfflineBanner() {
  const isOnline = useOnlineStatus()

  // When offline, render the full-screen OfflinePage overlay.
  // The rest of the app remains mounted underneath to preserve input states.
  if (!isOnline) {
    return <OfflinePage />
  }

  return null
}
