import { getDB } from './db'
import type { LocalProduct } from './types'
import { generateUUID, nowISO } from './utils'

export type CreateProductInput = {
  name: string
  defaultPrice: number
  costPrice: number
  stock: number
  categoryId?: string
  providerId?: string
}

/**
 * Create or update a product locally.
 */
export async function createProduct(input: CreateProductInput): Promise<LocalProduct> {
  const now = nowISO()
  const product: LocalProduct = {
    uuid: generateUUID(),
    ...input,
    syncStatus: 'pending',
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  }
  await getDB().products.add(product)
  return product
}

export async function updateProduct(
  uuid: string,
  updates: Partial<CreateProductInput>
): Promise<void> {
  await getDB().products.update(uuid, {
    ...updates,
    syncStatus: 'pending',
    updatedAt: nowISO(),
  })
}

export async function getAllProducts(): Promise<LocalProduct[]> {
  return getDB().products.toArray()
}

export async function getProductByUuid(uuid: string): Promise<LocalProduct | undefined> {
  return getDB().products.get(uuid)
}

export async function getProductByServerId(serverId: string): Promise<LocalProduct | undefined> {
  return getDB().products.where('serverId').equals(serverId).first()
}

export async function markProductSynced(uuid: string, serverId: string): Promise<void> {
  await getDB().products.update(uuid, {
    serverId,
    syncStatus: 'synced',
    updatedAt: nowISO(),
  })
}

export async function markProductFailed(uuid: string, error: string): Promise<void> {
  const p = await getDB().products.get(uuid)
  await getDB().products.update(uuid, {
    syncStatus: 'failed',
    syncError: error,
    retryCount: (p?.retryCount ?? 0) + 1,
    updatedAt: nowISO(),
  })
}

/**
 * Upsert products from server (cache refresh).
 * Matches by serverId — inserts if new, updates if changed.
 */
export async function upsertProductsFromServer(
  serverProducts: Array<{
    id: string
    name: string
    defaultPrice: number
    costPrice: number
    stock: number
    categoryId?: string | null
    providerId?: string | null
    createdAt: string
    updatedAt: string
  }>
): Promise<void> {
  const db = getDB()
  const now = nowISO()

  await db.transaction('rw', db.products, async () => {
    for (const sp of serverProducts) {
      const existing = await db.products.where('serverId').equals(sp.id).first()
      if (existing) {
        // Only update if server version is newer and record isn't locally pending
        if (existing.syncStatus !== 'pending') {
          await db.products.update(existing.uuid, {
            name: sp.name,
            defaultPrice: sp.defaultPrice,
            costPrice: sp.costPrice,
            stock: sp.stock,
            categoryId: sp.categoryId ?? undefined,
            providerId: sp.providerId ?? undefined,
            serverId: sp.id,
            syncStatus: 'synced',
            updatedAt: now,
          })
        }
      } else {
        await db.products.add({
          uuid: generateUUID(),
          serverId: sp.id,
          name: sp.name,
          defaultPrice: sp.defaultPrice,
          costPrice: sp.costPrice,
          stock: sp.stock,
          categoryId: sp.categoryId ?? undefined,
          providerId: sp.providerId ?? undefined,
          syncStatus: 'synced',
          retryCount: 0,
          createdAt: sp.createdAt,
          updatedAt: now,
        })
      }
    }
  })
}

/**
 * Decrement stock locally when a transaction is recorded.
 */
export async function decrementStock(uuid: string, quantity: number): Promise<void> {
  const product = await getDB().products.get(uuid)
  if (product) {
    await getDB().products.update(uuid, {
      stock: Math.max(0, product.stock - quantity),
      updatedAt: nowISO(),
    })
  }
}
