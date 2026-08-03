import { getDB } from './db'
import type { LocalProvider } from './types'
import { generateUUID, nowISO } from './utils'

export async function createProvider(input: {
  name: string
  phone?: string
}): Promise<LocalProvider> {
  const now = nowISO()
  const provider: LocalProvider = {
    uuid: generateUUID(),
    name: input.name,
    phone: input.phone,
    syncStatus: 'pending',
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  }
  await getDB().providers.add(provider)
  return provider
}

export async function updateProvider(
  uuid: string,
  updates: { name?: string; phone?: string }
): Promise<void> {
  await getDB().providers.update(uuid, {
    ...updates,
    syncStatus: 'pending',
    updatedAt: nowISO(),
  })
}

export async function getAllProviders(): Promise<LocalProvider[]> {
  return getDB().providers.orderBy('name').toArray()
}

export async function getProviderByUuid(uuid: string): Promise<LocalProvider | undefined> {
  return getDB().providers.get(uuid)
}

export async function markProviderSynced(uuid: string, serverId: string): Promise<void> {
  await getDB().providers.update(uuid, {
    serverId,
    syncStatus: 'synced',
    updatedAt: nowISO(),
  })
}

export async function markProviderFailed(uuid: string, error: string): Promise<void> {
  const p = await getDB().providers.get(uuid)
  await getDB().providers.update(uuid, {
    syncStatus: 'failed',
    syncError: error,
    retryCount: (p?.retryCount ?? 0) + 1,
    updatedAt: nowISO(),
  })
}

export async function upsertProvidersFromServer(
  serverProviders: Array<{
    id: string
    name: string
    phone?: string | null
    createdAt: string
  }>
): Promise<void> {
  const db = getDB()
  const now = nowISO()

  await db.transaction('rw', db.providers, async () => {
    for (const sp of serverProviders) {
      const existing = await db.providers.where('serverId').equals(sp.id).first()
      if (existing) {
        if (existing.syncStatus !== 'pending') {
          await db.providers.update(existing.uuid, {
            name: sp.name,
            phone: sp.phone ?? undefined,
            serverId: sp.id,
            syncStatus: 'synced',
            updatedAt: now,
          })
        }
      } else {
        await db.providers.add({
          uuid: generateUUID(),
          serverId: sp.id,
          name: sp.name,
          phone: sp.phone ?? undefined,
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
 * Delete a provider.
 * If the provider has already been synced (has serverId), mark as pendingDelete
 * instead of hard deleting, so the deletion can be propagated to the server.
 */
export async function deleteProvider(uuid: string): Promise<void> {
  const db = getDB()
  const provider = await db.providers.get(uuid)
  if (!provider) return

  if (provider.serverId) {
    await db.providers.update(uuid, {
      pendingDelete: true,
      syncStatus: 'pending',
      updatedAt: nowISO(),
    })
  } else {
    await db.providers.delete(uuid)
  }
}
