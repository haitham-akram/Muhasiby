'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getPaymentsByProvider,
  createProviderPayment,
  upsertPaymentsFromServer,
} from '@/lib/local/providerPaymentRepo'
import type { LocalProviderPayment } from '@/lib/local/types'

export function useProviderPayments(providerUuid?: string) {
  const [payments, setPayments] = useState<LocalProviderPayment[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(async () => {
    if (!providerUuid) {
      setPayments([])
      return
    }
    setIsLoading(true)
    try {
      const local = await getPaymentsByProvider(providerUuid)
      setPayments(local)

      // If online, also pull from server to catch any other device's payments
      if (navigator.onLine) {
        try {
          const res = await fetch(`/api/providers/${providerUuid}/payments`)
          if (res.ok) {
            const { payments: serverPayments } = await res.json()
            await upsertPaymentsFromServer(providerUuid, serverPayments)
            const refreshed = await getPaymentsByProvider(providerUuid)
            setPayments(refreshed)
          }
        } catch {
          // Swallow — local data is fine
        }
      }
    } catch {
      setPayments([])
    } finally {
      setIsLoading(false)
    }
  }, [providerUuid])

  useEffect(() => {
    load()
  }, [load])

  async function addPayment(input: { providerUuid: string; providerServerId?: string; amount: number; date: string }): Promise<LocalProviderPayment> {
    const payment = await createProviderPayment(input)
    setPayments((prev) => [payment, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    return payment
  }

  return { payments, isLoading, mutatePayments: load, addPayment }
}