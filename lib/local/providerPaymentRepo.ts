import { getDB } from './db'
import type { LocalProviderPayment } from './types'
import { generateUUID, nowISO } from './utils'

export async function createProviderPayment(input: {
  providerUuid: string
  providerServerId?: string
  amount: number
  date: string
}): Promise<LocalProviderPayment> {
  const now = nowISO()
  const payment: LocalProviderPayment = {
    uuid: generateUUID(),
    providerUuid: input.providerUuid,
    providerServerId: input.providerServerId,
    amount: input.amount,
    date: input.date,
    syncStatus: 'pending',
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  }
  await getDB().providerPayments.add(payment)
  return payment
}

export async function getPaymentsByProvider(
  providerUuid: string
): Promise<LocalProviderPayment[]> {
  const payments = await getDB().providerPayments
    .where('providerUuid')
    .equals(providerUuid)
    .toArray()
  return payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function markPaymentSynced(uuid: string, serverId: string): Promise<void> {
  await getDB().providerPayments.update(uuid, {
    serverId,
    syncStatus: 'synced',
    updatedAt: nowISO(),
  })
}

export async function markPaymentFailed(uuid: string, error: string): Promise<void> {
  const p = await getDB().providerPayments.get(uuid)
  await getDB().providerPayments.update(uuid, {
    syncStatus: 'failed',
    syncError: error,
    retryCount: (p?.retryCount ?? 0) + 1,
    updatedAt: nowISO(),
  })
}

export async function upsertPaymentsFromServer(
  providerUuid: string,
  serverPayments: Array<{
    id: string
    providerId: string
    amount: number
    date: string
    createdAt: string
  }>
): Promise<void> {
  const db = getDB()
  const now = nowISO()

  await db.transaction('rw', db.providerPayments, async () => {
    for (const sp of serverPayments) {
      const existing = await db.providerPayments.where('serverId').equals(sp.id).first()
      if (existing) {
        if (existing.syncStatus !== 'pending') {
          await db.providerPayments.update(existing.uuid, {
            amount: sp.amount,
            date: sp.date,
            serverId: sp.id,
            syncStatus: 'synced',
            updatedAt: now,
          })
        }
      } else {
        await db.providerPayments.add({
          uuid: generateUUID(),
          serverId: sp.id,
          providerUuid,
          providerServerId: sp.providerId,
          amount: sp.amount,
          date: sp.date,
          syncStatus: 'synced',
          retryCount: 0,
          createdAt: sp.createdAt,
          updatedAt: now,
        })
      }
    }
  })
}
