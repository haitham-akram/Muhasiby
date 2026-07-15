'use client'

import { useSyncStatus } from '@/lib/sync/syncContext'
import { useLanguage } from '@/app/providers'
import { useEffect, useState } from 'react'

export default function SyncStatusIndicator() {
  const { state, pendingCount, failedCount, lastSyncedAt, conflict, dismissConflict } =
    useSyncStatus()
  const { t } = useLanguage()
  const [showConflict, setShowConflict] = useState(false)

  useEffect(() => {
    if (conflict) setShowConflict(true)
  }, [conflict])

  function handleDismiss() {
    setShowConflict(false)
    dismissConflict()
  }

  const pill = (() => {
    if (state === 'offline')
      return {
        label: pendingCount > 0 ? `Offline — ${pendingCount} pending` : 'Offline',
        cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
        dot: 'bg-amber-500',
      }
    if (state === 'syncing')
      return {
        label: 'Syncing…',
        cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
        dot: 'bg-blue-500 animate-pulse',
      }
    if (failedCount > 0)
      return {
        label: `Sync error — ${failedCount} failed`,
        cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
        dot: 'bg-red-500',
      }
    if (pendingCount > 0)
      return {
        label: `${pendingCount} pending`,
        cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
        dot: 'bg-yellow-500 animate-pulse',
      }
    return {
      label: 'Synced',
      cls: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
      dot: 'bg-green-500',
    }
  })()

  return (
    <>
      {/* Status pill */}
      <div
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${pill.cls}`}
        title={lastSyncedAt ? `Last synced: ${lastSyncedAt.toLocaleTimeString()}` : 'Not yet synced'}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${pill.dot}`} />
        {pill.label}
      </div>

      {/* Conflict modal */}
      {showConflict && conflict && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-bold text-status-cancelled">Sync Conflict</h3>
            <p className="mb-4 text-sm text-text-secondary">
              {conflict.message ??
                'A conflict was detected while syncing. Your offline changes were not applied.'}
            </p>
            <p className="mb-6 text-xs text-text-secondary">
              Please review and reconcile this manually with your admin.
            </p>
            <button
              className="w-full rounded-xl bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
              onClick={handleDismiss}
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  )
}
