import { getDB } from './db'
import type { LocalBill, LocalBillItem } from './types'
import { generateUUID, nowISO } from './utils'

export type CreateBillInput = {
  providerUuid: string
  providerServerId?: string
  totalAmount: number
  status: 'UNPAID' | 'PARTIAL' | 'PAID'
  date: string
  items: Array<{
    productUuid?: string
    description: string
    quantity: number
    unitPrice: number
    sellPrice?: number
    total: number
  }>
}

export type LocalBillWithItems = LocalBill & { items: LocalBillItem[] }

export async function createBill(input: CreateBillInput): Promise<LocalBillWithItems> {
  const db = getDB()
  const now = nowISO()
  const billUuid = generateUUID()

  const bill: LocalBill = {
    uuid: billUuid,
    providerUuid: input.providerUuid,
    providerServerId: input.providerServerId,
    totalAmount: input.totalAmount,
    status: input.status,
    date: input.date,
    syncStatus: 'pending',
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  }

  const items: LocalBillItem[] = input.items.map((item) => ({
    uuid: generateUUID(),
    billUuid,
    productUuid: item.productUuid,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    sellPrice: item.sellPrice,
    total: item.total,
    syncStatus: 'pending' as const,
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  }))

  await db.transaction('rw', [db.bills, db.billItems], async () => {
    await db.bills.add(bill)
    if (items.length) await db.billItems.bulkAdd(items)
  })

  return { ...bill, items }
}

export async function getBillsByProvider(providerUuid: string): Promise<LocalBillWithItems[]> {
  const db = getDB()
  const bills = await db.bills
    .where('providerUuid')
    .equals(providerUuid)
    .toArray()

  const billsSorted = bills.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const allItems = await db.billItems
    .where('billUuid')
    .anyOf(billsSorted.map((b) => b.uuid))
    .toArray()

  return billsSorted.map((bill) => ({
    ...bill,
    items: allItems.filter((i) => i.billUuid === bill.uuid),
  }))
}

export async function updateBillStatus(
  uuid: string,
  status: 'UNPAID' | 'PARTIAL' | 'PAID'
): Promise<void> {
  await getDB().bills.update(uuid, {
    status,
    syncStatus: 'pending',
    updatedAt: nowISO(),
  })
}

export async function markBillSynced(uuid: string, serverId: string): Promise<void> {
  await getDB().bills.update(uuid, {
    serverId,
    syncStatus: 'synced',
    updatedAt: nowISO(),
  })
}

export async function markBillFailed(uuid: string, error: string): Promise<void> {
  const bill = await getDB().bills.get(uuid)
  await getDB().bills.update(uuid, {
    syncStatus: 'failed',
    syncError: error,
    retryCount: (bill?.retryCount ?? 0) + 1,
    updatedAt: nowISO(),
  })
}

export async function upsertBillsFromServer(
  providerUuid: string,
  serverBills: Array<{
    id: string
    providerId: string
    totalAmount: number
    status: string
    date: string
    createdAt: string
    items?: Array<{
      id: string
      description: string
      quantity: number
      unitPrice: number
      sellPrice?: number | null
      total: number
      productId?: string | null
    }>
  }>
): Promise<void> {
  const db = getDB()
  const now = nowISO()

  await db.transaction('rw', [db.bills, db.billItems], async () => {
    for (const sb of serverBills) {
      const existing = await db.bills.where('serverId').equals(sb.id).first()
      const billUuid = existing?.uuid ?? generateUUID()

      const billData: LocalBill = {
        uuid: billUuid,
        serverId: sb.id,
        providerUuid,
        providerServerId: sb.providerId,
        totalAmount: sb.totalAmount,
        status: sb.status as 'UNPAID' | 'PARTIAL' | 'PAID',
        date: sb.date,
        syncStatus: 'synced',
        retryCount: 0,
        createdAt: sb.createdAt,
        updatedAt: now,
      }

      if (existing && existing.syncStatus !== 'pending') {
        await db.bills.update(billUuid, billData)
      } else if (!existing) {
        await db.bills.add(billData)
      }

      if (sb.items && (!existing || existing.syncStatus !== 'pending')) {
        await db.billItems.where('billUuid').equals(billUuid).delete()
        await db.billItems.bulkAdd(
          sb.items.map((item) => ({
            uuid: generateUUID(),
            serverId: item.id,
            billUuid,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            sellPrice: item.sellPrice ?? undefined,
            total: item.total,
            syncStatus: 'synced' as const,
            retryCount: 0,
            createdAt: sb.createdAt,
            updatedAt: now,
          }))
        )
      }
    }
  })
}

/**
 * Delete a bill and its items.
 * If the bill has already been synced (has serverId), mark as pendingDelete
 * instead of hard deleting, so the deletion can be propagated to the server.
 */
export async function deleteBill(uuid: string): Promise<void> {
  const db = getDB()
  const bill = await db.bills.get(uuid)
  if (!bill) return

  if (bill.serverId) {
    await db.transaction('rw', [db.bills, db.billItems], async () => {
      await db.bills.update(uuid, {
        pendingDelete: true,
        syncStatus: 'pending',
        updatedAt: nowISO(),
      })
      await db.billItems.where('billUuid').equals(uuid).modify({ pendingDelete: true, syncStatus: 'pending', updatedAt: nowISO() })
    })
  } else {
    await db.transaction('rw', [db.bills, db.billItems], async () => {
      await db.bills.delete(uuid)
      await db.billItems.where('billUuid').equals(uuid).delete()
    })
  }
}
