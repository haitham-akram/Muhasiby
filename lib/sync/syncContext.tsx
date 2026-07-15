'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import { runSync, getPendingCount, getFailedCount } from '@/lib/sync/syncEngine'

// ─── Types ────────────────────────────────────────────────────────────────────

type SyncState = 'idle' | 'syncing' | 'offline' | 'error'

type SyncConflict = {
  type: string
  uuid: string
  message: string
}

type SyncContextValue = {
  state: SyncState
  pendingCount: number
  failedCount: number
  lastSyncedAt: Date | null
  conflict: SyncConflict | null
  dismissConflict: () => void
  triggerSync: () => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SyncContext = createContext<SyncContextValue | null>(null)

export function useSyncStatus() {
  const ctx = useContext(SyncContext)
  if (!ctx) throw new Error('useSyncStatus must be used within SyncProvider')
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const SYNC_INTERVAL_MS = 30_000 // 30 seconds

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SyncState>('idle')
  const [pendingCount, setPendingCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const [conflict, setConflict] = useState<SyncConflict | null>(null)
  const syncingRef = useRef(false)

  const refreshCounts = useCallback(async () => {
    const [p, f] = await Promise.all([getPendingCount(), getFailedCount()])
    setPendingCount(p)
    setFailedCount(f)
  }, [])

  const triggerSync = useCallback(async () => {
    if (syncingRef.current) return
    if (!navigator.onLine) {
      setState('offline')
      return
    }

    syncingRef.current = true
    setState('syncing')

    try {
      await runSync()
      await refreshCounts()
      setLastSyncedAt(new Date())
      setState(navigator.onLine ? 'idle' : 'offline')
    } catch {
      setState('error')
    } finally {
      syncingRef.current = false
    }
  }, [refreshCounts])

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState('idle')
      triggerSync()
    }
    const handleOffline = () => setState('offline')

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if (!navigator.onLine) setState('offline')

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [triggerSync])

  // Periodic sync while online
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) triggerSync()
    }, SYNC_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [triggerSync])

  // Listen for sync-complete events to refresh counts
  useEffect(() => {
    const handleComplete = () => refreshCounts()
    window.addEventListener('muhasiby:sync-complete', handleComplete)
    return () => window.removeEventListener('muhasiby:sync-complete', handleComplete)
  }, [refreshCounts])

  // Listen for conflict events
  useEffect(() => {
    const handleConflict = (e: Event) => {
      const detail = (e as CustomEvent<SyncConflict>).detail
      setConflict(detail)
    }
    window.addEventListener('muhasiby:sync-conflict', handleConflict)
    return () => window.removeEventListener('muhasiby:sync-conflict', handleConflict)
  }, [])

  // Initial load: refresh counts + trigger sync
  useEffect(() => {
    refreshCounts()
    if (navigator.onLine) triggerSync()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <SyncContext.Provider
      value={{
        state,
        pendingCount,
        failedCount,
        lastSyncedAt,
        conflict,
        dismissConflict: () => setConflict(null),
        triggerSync,
      }}
    >
      {children}
    </SyncContext.Provider>
  )
}
