'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getAllCustomers,
  upsertCustomersFromServer,
  createCustomer,
  getCustomerByPhone,
} from '@/lib/local/customerRepo'
import type { LocalCustomer } from '@/lib/local/types'

/**
 * Local-first customers hook.
 */
export function useCustomers() {
  const [customers, setCustomers] = useState<LocalCustomer[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    const local = await getAllCustomers()
    setCustomers(local)
    setIsLoading(false)

    if (navigator.onLine) {
      try {
        const res = await fetch('/api/customers')
        if (res.ok) {
          const data = await res.json()
          const serverCustomers = data.customers ?? data
          await upsertCustomersFromServer(serverCustomers)
          const refreshed = await getAllCustomers()
          setCustomers(refreshed)
        }
      } catch {
        // Use local cache
      }
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function addCustomer(input: { name: string; phone: string }): Promise<LocalCustomer> {
    // Check if already exists locally
    const existing = await getCustomerByPhone(input.phone)
    if (existing) return existing

    const customer = await createCustomer(input)
    setCustomers((prev) => [...prev, customer].sort((a, b) => a.name.localeCompare(b.name)))
    return customer
  }

  return { customers, isLoading, mutateCustomers: load, addCustomer }
}
