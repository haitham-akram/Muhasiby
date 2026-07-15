'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getTransactionsBySession,
  createTransaction,
  updateTransactionStatus,
  deleteTransaction,
  upsertTransactionFromServer,
  type CreateTransactionInput,
  type LocalTransactionWithDetails,
} from '@/lib/local/transactionRepo'

/**
 * Local-first transactions hook.
 * All mutations write to IndexedDB first and return immediately.
 * Background sync is handled by the sync engine.
 */
export function useTransactions(sessionUuid?: string) {
  const [transactions, setTransactions] = useState<LocalTransactionWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  const load = useCallback(async () => {
    if (!sessionUuid) {
      setTransactions([])
      return
    }
    setIsLoading(true)
    try {
      const local = await getTransactionsBySession(sessionUuid)
      setTransactions(local)

      // If online, also pull from server to catch any other device's transactions
      if (navigator.onLine) {
        try {
          // Find the session's serverId to query the server
          const { getSessionByUuid } = await import('@/lib/local/sessionRepo')
          const localSession = await getSessionByUuid(sessionUuid)
          const serverId = localSession?.serverId
          if (serverId) {
            const res = await fetch(`/api/transactions?sessionId=${serverId}`)
            if (res.ok) {
              const { transactions: serverTxs } = await res.json()
              for (const stx of serverTxs) {
                await upsertTransactionFromServer(stx, sessionUuid)
              }
              const refreshed = await getTransactionsBySession(sessionUuid)
              setTransactions(refreshed)
            }
          }
        } catch {
          // Swallow — local data is fine
        }
      }
    } catch {
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [sessionUuid])

  useEffect(() => {
    load()
  }, [load])

  async function addTransaction(
    input: CreateTransactionInput
  ): Promise<LocalTransactionWithDetails> {
    const tx = await createTransaction(input)
    setTransactions((prev) => [tx, ...prev])
    return tx
  }

  async function toggleStatus(
    uuid: string,
    status: 'CONFIRMED' | 'PENDING' | 'CANCELLED'
  ): Promise<void> {
    await updateTransactionStatus(uuid, status)
    setTransactions((prev) =>
      prev.map((t) => (t.uuid === uuid ? { ...t, status } : t))
    )
  }

  async function remove(uuid: string): Promise<void> {
    await deleteTransaction(uuid)
    setTransactions((prev) => prev.filter((t) => t.uuid !== uuid))
  }

  return {
    transactions,
    isLoading,
    isError,
    mutateTransactions: load,
    addTransaction,
    toggleStatus,
    removeTransaction: remove,
  }
}
