'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getAllProviders,
  upsertProvidersFromServer,
  createProvider,
} from '@/lib/local/providerRepo'
import type { LocalProvider } from '@/lib/local/types'

export function useProviders() {
  const [providers, setProviders] = useState<LocalProvider[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    const local = await getAllProviders()
    setProviders(local)
    setIsLoading(false)

    if (navigator.onLine) {
      try {
        const res = await fetch('/api/providers')
        if (res.ok) {
          const data = await res.json()
          const serverProviders = data.providers ?? data
          await upsertProvidersFromServer(serverProviders)
          const refreshed = await getAllProviders()
          setProviders(refreshed)
        }
      } catch {
        // Use local cache
      }
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function addProvider(input: { name: string; phone?: string }): Promise<LocalProvider> {
    const provider = await createProvider(input)
    setProviders((prev) => [...prev, provider].sort((a, b) => a.name.localeCompare(b.name)))
    return provider
  }

  return { providers, isLoading, mutateProviders: load, addProvider }
}