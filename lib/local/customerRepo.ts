import { getDB } from './db'
import type { LocalCustomer } from './types'
import { generateUUID, nowISO } from './utils'

export async function createCustomer(input: {
  name: string
  phone: string
}): Promise<LocalCustomer> {
  const now = nowISO()
  const customer: LocalCustomer = {
    uuid: generateUUID(),
    name: input.name,
    phone: input.phone,
    syncStatus: 'pending',
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  }
  await getDB().customers.add(customer)
  return customer
}

export async function getAllCustomers(): Promise<LocalCustomer[]> {
  return getDB().customers.orderBy('name').toArray()
}

export async function getCustomerByPhone(phone: string): Promise<LocalCustomer | undefined> {
  return getDB().customers.where('phone').equals(phone).first()
}

export async function markCustomerSynced(uuid: string, serverId: string): Promise<void> {
  await getDB().customers.update(uuid, {
    serverId,
    syncStatus: 'synced',
    updatedAt: nowISO(),
  })
}

export async function markCustomerFailed(uuid: string, error: string): Promise<void> {
  const c = await getDB().customers.get(uuid)
  await getDB().customers.update(uuid, {
    syncStatus: 'failed',
    syncError: error,
    retryCount: (c?.retryCount ?? 0) + 1,
    updatedAt: nowISO(),
  })
}

export async function updateCustomer(
  uuid: string,
  updates: Partial<{ name: string; phone: string }>
): Promise<void> {
  await getDB().customers.update(uuid, {
    ...updates,
    syncStatus: 'pending',
    updatedAt: nowISO(),
  })
}

/**
 * Delete a customer.
 * If the customer has already been synced (has serverId), mark as pendingDelete
 * instead of hard deleting, so the deletion can be propagated to the server.
 */
export async function deleteCustomer(uuid: string): Promise<void> {
  const db = getDB()
  const customer = await db.customers.get(uuid)
  if (!customer) return

  if (customer.serverId) {
    await db.customers.update(uuid, {
      pendingDelete: true,
      syncStatus: 'pending',
      updatedAt: nowISO(),
    })
  } else {
    await db.customers.delete(uuid)
  }
}

/**
 * Upsert customers from server (cache refresh).
 */
export async function upsertCustomersFromServer(
  serverCustomers: Array<{
    id: string
    name: string
    phone: string
    createdAt: string
  }>
): Promise<void> {
  const db = getDB()
  const now = nowISO()

  await db.transaction('rw', db.customers, async () => {
    for (const sc of serverCustomers) {
      const existingByPhone = await db.customers.where('phone').equals(sc.phone).first()
      if (existingByPhone) {
        if (existingByPhone.syncStatus !== 'pending') {
          await db.customers.update(existingByPhone.uuid, {
            name: sc.name,
            serverId: sc.id,
            syncStatus: 'synced',
            updatedAt: now,
          })
        }
      } else {
        await db.customers.add({
          uuid: generateUUID(),
          serverId: sc.id,
          name: sc.name,
          phone: sc.phone,
          syncStatus: 'synced',
          retryCount: 0,
          createdAt: sc.createdAt,
          updatedAt: now,
        })
      }
    }
  })
}
