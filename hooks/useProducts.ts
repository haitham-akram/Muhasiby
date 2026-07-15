'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getAllProducts,
  upsertProductsFromServer,
  createProduct,
  type CreateProductInput,
} from '@/lib/local/productRepo'
import type { LocalProduct } from '@/lib/local/types'

/**
 * Local-first products hook.
 * Reads from IndexedDB immediately (offline-capable).
 * When online: refreshes the local cache from the server.
 */
export function useProducts() {
  const [products, setProducts] = useState<LocalProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    const local = await getAllProducts()
    setProducts(local)
    setIsLoading(false)

    if (navigator.onLine) {
      try {
        const res = await fetch('/api/products')
        if (res.ok) {
          const data = await res.json()
          const serverProducts = data.products ?? data
          await upsertProductsFromServer(serverProducts)
          const refreshed = await getAllProducts()
          setProducts(refreshed)
        }
      } catch {
        // Offline or server error — use local cache
      }
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function addProduct(input: CreateProductInput): Promise<LocalProduct> {
    const product = await createProduct(input)
    setProducts((prev) => [...prev, product])
    return product
  }

  return { products, isLoading, mutateProducts: load, addProduct }
}
