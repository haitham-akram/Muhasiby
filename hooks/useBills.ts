'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getBillsByProvider,
  createBill,
  updateBillStatus,
  upsertBillsFromServer,
  type CreateBillInput,
  type LocalBillWithItems,
} from '@/lib/local/billRepo'
import type { LocalProvider } from '@/lib/local/types'

export function useBills(providerUuid?: string) {
  const [bills, setBills] = useState<LocalBillWithItems[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(async () => {
    if (!providerUuid) {
      setBills([])
      return
    }
    setIsLoading(true)
    try {
      const local = await getBillsByProvider(providerUuid)
      setBills(local)

      // If online, also pull from server to catch any other device's bills
      if (navigator.onLine) {
        try {
          const res = await fetch(`/api/providers/${providerUuid}/bills`)
          if (res.ok) {
            const { bills: serverBills } = await res.json()
            await upsertBillsFromServer(providerUuid, serverBills)
            const refreshed = await getBillsByProvider(providerUuid)
            setBills(refreshed)
          }
        } catch {
          // Swallow — local data is fine
        }
      }
    } catch {
      setBills([])
    } finally {
      setIsLoading(false)
    }
  }, [providerUuid])

  useEffect(() => {
    load()
  }, [load])

  async function addBill(input: CreateBillInput): Promise<LocalBillWithItems> {
    const bill = await createBill(input)
    setBills((prev) => [bill, ...prev])
    return bill
  }

  async function updateStatus(uuid: string, status: 'UNPAID' | 'PARTIAL' | 'PAID'): Promise<void> {
    await updateBillStatus(uuid, status)
    setBills((prev) => prev.map((b) => (b.uuid === uuid ? { ...b, status } : b)))
  }

  return { bills, isLoading, mutateBills: load, addBill, updateStatus }
}