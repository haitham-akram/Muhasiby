'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession as useNextAuthSession } from 'next-auth/react'
import {
  getTodaySession,
  openSession,
  closeSession,
  upsertSessionFromServer,
} from '@/lib/local/sessionRepo'
import type { LocalSession } from '@/lib/local/types'

/**
 * Local-first session hook.
 * - Reads from IndexedDB first (instant, works offline).
 * - On mount (if online): pulls today's session from the server to stay in sync.
 * - openSession() / closeSession() write to IndexedDB first, then trigger a background sync.
 */
export function useSession() {
  const { data: authData } = useNextAuthSession()
  const userId = authData?.user?.id ?? ''

  const [session, setSession] = useState<LocalSession | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const load = useCallback(async () => {
    if (!userId) return
    try {
      const local = await getTodaySession(userId)
      setSession(local)
      setIsLoading(false)

      // If online, also pull from server and reconcile
      if (navigator.onLine) {
        try {
          const res = await fetch('/api/sessions?today=true')
          if (res.ok) {
            const { session: serverSession } = await res.json()
            if (serverSession) {
              await upsertSessionFromServer({ ...serverSession, userId })
              const refreshed = await getTodaySession(userId)
              setSession(refreshed)
            }
          }
        } catch {
          // Swallow network errors — local data is fine
        }
      }
    } catch {
      setIsError(true)
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  async function handleOpenSession() {
    if (!userId) return
    const s = await openSession(userId)
    setSession(s)

    // Fire-and-forget background sync
    if (navigator.onLine) {
      fetch('/api/sessions', { method: 'POST' })
        .then(async (res) => {
          if (res.ok) {
            const { session: serverSession } = await res.json()
            const { markSessionSynced } = await import('@/lib/local/sessionRepo')
            await markSessionSynced(s.uuid, serverSession.id)
            const refreshed = await getTodaySession(userId)
            setSession(refreshed)
          }
        })
        .catch(() => {/* will sync later */})
    }
  }

  async function handleCloseSession(uuid: string) {
    await closeSession(uuid)
    const refreshed = await getTodaySession(userId)
    setSession(refreshed)
  }

  return {
    session,
    isLoading,
    isError,
    mutateSession: load,
    openSession: handleOpenSession,
    closeSession: handleCloseSession,
  }
}
