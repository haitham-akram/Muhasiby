import { getDB } from './db'
import type { LocalTransaction, LocalTransactionItem, LocalPaymentSplit } from './types'
import { generateUUID, nowISO } from './utils'

export type CreateTransactionInput = {
  sessionUuid: string
  sessionServerId?: string
  buyerName: string
  buyerPhone?: string
  items: string
  paymentMethod: string
  amount: number
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED'
  transactionItems?: Array<{
    productUuid?: string
    name: string
    quantity: number
    unitCost: number
    unitPrice: number
    totalPrice: number
  }>
  paymentSplits?: Array<{
    method: string
    amount: number
  }>
}

export type LocalTransactionWithDetails = LocalTransaction & {
  transactionItems: LocalTransactionItem[]
  paymentSplits: LocalPaymentSplit[]
}

/**
 * Create a transaction (with items and payment splits) locally.
 * Everything is written atomically via a Dexie transaction.
 */
export async function createTransaction(
  input: CreateTransactionInput
): Promise<LocalTransactionWithDetails> {
  const db = getDB()
  const now = nowISO()
  const txUuid = generateUUID()

  const tx: LocalTransaction = {
    uuid: txUuid,
    sessionUuid: input.sessionUuid,
    sessionServerId: input.sessionServerId,
    buyerName: input.buyerName,
    buyerPhone: input.buyerPhone,
    items: input.items,
    paymentMethod: input.paymentMethod,
    amount: input.amount,
    status: input.status,
    syncStatus: 'pending',
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  }

  const items: LocalTransactionItem[] = (input.transactionItems ?? []).map((item) => ({
    uuid: generateUUID(),
    transactionUuid: txUuid,
    productUuid: item.productUuid,
    name: item.name,
    quantity: item.quantity,
    unitCost: item.unitCost,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
    syncStatus: 'pending' as const,
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  }))

  const splits: LocalPaymentSplit[] = (input.paymentSplits ?? []).map((split) => ({
    uuid: generateUUID(),
    transactionUuid: txUuid,
    method: split.method,
    amount: split.amount,
    syncStatus: 'pending' as const,
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  }))

  await db.transaction('rw', [db.transactions, db.transactionItems, db.paymentSplits], async () => {
    await db.transactions.add(tx)
    if (items.length) await db.transactionItems.bulkAdd(items)
    if (splits.length) await db.paymentSplits.bulkAdd(splits)
  })

  return { ...tx, transactionItems: items, paymentSplits: splits }
}

/**
 * Get all transactions for a session, newest first, with items and splits.
 */
export async function getTransactionsBySession(
  sessionUuid: string
): Promise<LocalTransactionWithDetails[]> {
  const db = getDB()
  const txs = await db.transactions
    .where('sessionUuid')
    .equals(sessionUuid)
    .toArray()

  const txsSorted = txs.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const allItems = await db.transactionItems
    .where('transactionUuid')
    .anyOf(txsSorted.map((t) => t.uuid))
    .toArray()

  const allSplits = await db.paymentSplits
    .where('transactionUuid')
    .anyOf(txsSorted.map((t) => t.uuid))
    .toArray()

  return txsSorted.map((tx) => ({
    ...tx,
    transactionItems: allItems.filter((i) => i.transactionUuid === tx.uuid),
    paymentSplits: allSplits.filter((s) => s.transactionUuid === tx.uuid),
  }))
}

/**
 * Update a transaction's status.
 */
export async function updateTransactionStatus(
  uuid: string,
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED'
): Promise<void> {
  await getDB().transactions.update(uuid, {
    status,
    syncStatus: 'pending',
    updatedAt: nowISO(),
  })
}

/**
 * Delete a transaction and all its children.
 * If the transaction has already been synced (has serverId), mark as pendingDelete
 * instead of hard deleting, so the deletion can be propagated to the server.
 */
export async function deleteTransaction(uuid: string): Promise<void> {
  const db = getDB()
  const tx = await db.transactions.get(uuid)
  if (!tx) return

  if (tx.serverId) {
    // Mark as pendingDelete instead of hard deleting
    await db.transaction('rw', [db.transactions, db.transactionItems, db.paymentSplits], async () => {
      await db.transactions.update(uuid, {
        pendingDelete: true,
        syncStatus: 'pending',
        updatedAt: nowISO(),
      })
      // Also mark children as pendingDelete
      await db.transactionItems.where('transactionUuid').equals(uuid).modify({ pendingDelete: true, syncStatus: 'pending', updatedAt: nowISO() })
      await db.paymentSplits.where('transactionUuid').equals(uuid).modify({ pendingDelete: true, syncStatus: 'pending', updatedAt: nowISO() })
    })
  } else {
    // Never synced — hard delete locally
    await db.transaction('rw', [db.transactions, db.transactionItems, db.paymentSplits], async () => {
      await db.transactions.delete(uuid)
      await db.transactionItems.where('transactionUuid').equals(uuid).delete()
      await db.paymentSplits.where('transactionUuid').equals(uuid).delete()
    })
  }
}

/**
 * Called by sync engine after transaction has been successfully synced.
 */
export async function markTransactionSynced(uuid: string, serverId: string): Promise<void> {
  await getDB().transactions.update(uuid, {
    serverId,
    syncStatus: 'synced',
    updatedAt: nowISO(),
  })
}

export async function markTransactionFailed(uuid: string, error: string): Promise<void> {
  const tx = await getDB().transactions.get(uuid)
  await getDB().transactions.update(uuid, {
    syncStatus: 'failed',
    syncError: error,
    retryCount: (tx?.retryCount ?? 0) + 1,
    updatedAt: nowISO(),
  })
}

/**
 * Upsert a transaction from server data (pull-down refresh).
 */
export async function upsertTransactionFromServer(
  serverTx: {
    id: string
    sessionId: string
    buyerName: string
    buyerPhone?: string | null
    items: string
    paymentMethod: string
    amount: number
    status: string
    createdAt: string
    updatedAt: string
    transactionItems?: Array<{
      id: string
      name: string
      quantity: number
      unitCost: number
      unitPrice: number
      totalPrice: number
      productId?: string | null
    }>
    paymentSplits?: Array<{ id: string; method: string; amount: number }>
  },
  sessionUuid?: string
): Promise<void> {
  const db = getDB()
  const existing = await db.transactions.where('serverId').equals(serverTx.id).first()
  const now = nowISO()

  const txUuid = existing?.uuid ?? generateUUID()

  const txData: LocalTransaction = {
    uuid: txUuid,
    serverId: serverTx.id,
    sessionUuid: sessionUuid ?? existing?.sessionUuid ?? '',
    sessionServerId: serverTx.sessionId,
    buyerName: serverTx.buyerName,
    buyerPhone: serverTx.buyerPhone ?? undefined,
    items: serverTx.items,
    paymentMethod: serverTx.paymentMethod,
    amount: serverTx.amount,
    status: serverTx.status as 'CONFIRMED' | 'PENDING' | 'CANCELLED',
    syncStatus: 'synced',
    retryCount: 0,
    createdAt: serverTx.createdAt,
    updatedAt: now,
  }

  await db.transaction('rw', [db.transactions, db.transactionItems, db.paymentSplits], async () => {
    if (existing) {
      await db.transactions.update(txUuid, txData)
    } else {
      await db.transactions.add(txData)
    }

    if (serverTx.transactionItems) {
      await db.transactionItems.where('transactionUuid').equals(txUuid).delete()
      await db.transactionItems.bulkAdd(
        serverTx.transactionItems.map((item) => ({
          uuid: generateUUID(),
          serverId: item.id,
          transactionUuid: txUuid,
          name: item.name,
          quantity: item.quantity,
          unitCost: item.unitCost,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          productUuid: undefined,
          syncStatus: 'synced' as const,
          retryCount: 0,
          createdAt: serverTx.createdAt,
          updatedAt: now,
        }))
      )
    }

    if (serverTx.paymentSplits) {
      await db.paymentSplits.where('transactionUuid').equals(txUuid).delete()
      await db.paymentSplits.bulkAdd(
        serverTx.paymentSplits.map((split) => ({
          uuid: generateUUID(),
          serverId: split.id,
          transactionUuid: txUuid,
          method: split.method,
          amount: split.amount,
          syncStatus: 'synced' as const,
          retryCount: 0,
          createdAt: serverTx.createdAt,
          updatedAt: now,
        }))
      )
    }
  })
}
