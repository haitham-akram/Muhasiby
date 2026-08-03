/**
 * Sync Engine — Phase 2
 *
 * Syncs all locally pending/failed records to the server in dependency order:
 *   Sessions → Transactions (+ items + splits) → Products → Customers → Providers → Bills → Payments
 *
 * Designed to be:
 *   - Idempotent: uses clientUuid-based upserts on the server
 *   - Resumable: if interrupted, re-running picks up where it left off
 *   - Safe: never silently overwrites conflicts
 */

import { getDB } from '@/lib/local/db'
import { nowISO } from '@/lib/local/utils'

const MAX_RETRIES = 5

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function markSynced(
  table: 'sessions' | 'transactions' | 'products' | 'customers' | 'providers' | 'bills' | 'providerPayments',
  uuid: string,
  serverId: string
) {
  const db = getDB()
  await db[table].update(uuid, { serverId, syncStatus: 'synced', updatedAt: nowISO() })
}

async function markFailed(
  table: 'sessions' | 'transactions' | 'products' | 'customers' | 'providers' | 'bills' | 'providerPayments',
  uuid: string,
  error: string
) {
  const db = getDB()
  const record = await db[table].get(uuid)
  await db[table].update(uuid, {
    syncStatus: (record?.retryCount ?? 0) >= MAX_RETRIES ? 'failed' : 'pending',
    syncError: error,
    retryCount: (record?.retryCount ?? 0) + 1,
    updatedAt: nowISO(),
  })
}

// ─── Step 1: Sync Sessions ────────────────────────────────────────────────────

async function syncSessions(): Promise<void> {
  const db = getDB()
  const pending = await db.sessions
    .where('syncStatus')
    .anyOf(['pending', 'failed'])
    .filter((s) => (s.retryCount ?? 0) < MAX_RETRIES)
    .toArray()

  for (const session of pending) {
    try {
      if (session.closedAt) {
        // Closing a session — PATCH if we have serverId, else create-then-close
        if (session.serverId) {
          const res = await fetch(`/api/sessions/${session.serverId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ closedAt: session.closedAt, clientUuid: session.uuid }),
          })

          if (res.status === 409) {
            // Conflict — session already closed on server
            const db2 = getDB()
            const { conflict } = await res.json()
            await db2.sessions.update(session.uuid, {
              syncStatus: 'failed',
              syncError: conflict ?? 'Session already closed by another user',
              updatedAt: nowISO(),
            })
            // Emit event so UI can show conflict message
            window.dispatchEvent(
              new CustomEvent('muhasiby:sync-conflict', {
                detail: { type: 'session', uuid: session.uuid, message: conflict },
              })
            )
            continue
          }

          if (!res.ok) {
            await markFailed('sessions', session.uuid, `HTTP ${res.status}`)
            continue
          }

          const { session: serverSession } = await res.json()
          await markSynced('sessions', session.uuid, serverSession.id)
        } else {
          // Create then mark closed
          const createRes = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientUuid: session.uuid, date: session.date }),
          })
          if (!createRes.ok) {
            await markFailed('sessions', session.uuid, `HTTP ${createRes.status}`)
            continue
          }
          const { session: created } = await createRes.json()
          await markSynced('sessions', session.uuid, created.id)

          // Now close it
          const closeRes = await fetch(`/api/sessions/${created.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ closedAt: session.closedAt }),
          })
          if (!closeRes.ok) {
            await markFailed('sessions', session.uuid, `Close HTTP ${closeRes.status}`)
          }
        }
      } else {
        // Open session
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientUuid: session.uuid, date: session.date }),
        })
        if (!res.ok) {
          await markFailed('sessions', session.uuid, `HTTP ${res.status}`)
          continue
        }
        const { session: serverSession } = await res.json()
        await markSynced('sessions', session.uuid, serverSession.id)
      }
    } catch (err) {
      await markFailed('sessions', session.uuid, String(err))
    }
  }
}

// ─── Step 2: Sync Products ────────────────────────────────────────────────────

async function syncProducts(): Promise<void> {
  const db = getDB()
  const pending = await db.products
    .where('syncStatus')
    .anyOf(['pending', 'failed'])
    .filter((p) => (p.retryCount ?? 0) < MAX_RETRIES)
    .toArray()

  for (const product of pending) {
    try {
      const body = {
        clientUuid: product.uuid,
        name: product.name,
        defaultPrice: product.defaultPrice,
        costPrice: product.costPrice,
        stock: product.stock,
        categoryId: product.categoryId ?? null,
        providerId: product.providerId ?? null,
      }

      const method = product.serverId ? 'PATCH' : 'POST'
      const url = product.serverId ? `/api/products/${product.serverId}` : '/api/products'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        await markFailed('products', product.uuid, `HTTP ${res.status}`)
        continue
      }

      const { product: serverProduct } = await res.json()
      await markSynced('products', product.uuid, serverProduct.id)
    } catch (err) {
      await markFailed('products', product.uuid, String(err))
    }
  }
}

// ─── Step 3: Sync Customers ───────────────────────────────────────────────────

async function syncCustomers(): Promise<void> {
  const db = getDB()
  const pending = await db.customers
    .where('syncStatus')
    .anyOf(['pending', 'failed'])
    .filter((c) => (c.retryCount ?? 0) < MAX_RETRIES)
    .toArray()

  for (const customer of pending) {
    try {
      const method = customer.serverId ? 'PATCH' : 'POST'
      const url = customer.serverId ? `/api/customers/${customer.serverId}` : '/api/customers'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientUuid: customer.uuid,
          name: customer.name,
          phone: customer.phone,
        }),
      })

      if (!res.ok) {
        await markFailed('customers', customer.uuid, `HTTP ${res.status}`)
        continue
      }

      const { customer: serverCustomer } = await res.json()
      await markSynced('customers', customer.uuid, serverCustomer.id)
    } catch (err) {
      await markFailed('customers', customer.uuid, String(err))
    }
  }
}

// ─── Step 4: Sync Providers ───────────────────────────────────────────────────

async function syncProviders(): Promise<void> {
  const db = getDB()
  const pending = await db.providers
    .where('syncStatus')
    .anyOf(['pending', 'failed'])
    .filter((p) => (p.retryCount ?? 0) < MAX_RETRIES)
    .toArray()

  for (const provider of pending) {
    try {
      const method = provider.serverId ? 'PATCH' : 'POST'
      const url = provider.serverId ? `/api/providers/${provider.serverId}` : '/api/providers'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientUuid: provider.uuid,
          name: provider.name,
          phone: provider.phone ?? null,
        }),
      })

      if (!res.ok) {
        await markFailed('providers', provider.uuid, `HTTP ${res.status}`)
        continue
      }

      const { provider: serverProvider } = await res.json()
      await markSynced('providers', provider.uuid, serverProvider.id)
    } catch (err) {
      await markFailed('providers', provider.uuid, String(err))
    }
  }
}

// ─── Step 5: Sync Transactions ────────────────────────────────────────────────

async function syncTransactions(): Promise<void> {
  const db = getDB()
  const pending = await db.transactions
    .where('syncStatus')
    .anyOf(['pending', 'failed'])
    .filter((t) => (t.retryCount ?? 0) < MAX_RETRIES)
    .toArray()

  for (const tx of pending) {
    try {
      // Resolve session serverId — must be synced first
      let sessionServerId = tx.sessionServerId
      if (!sessionServerId) {
        const localSession = await db.sessions.get(tx.sessionUuid)
        if (!localSession?.serverId) {
          // Session not yet synced — skip for now, will retry
          continue
        }
        sessionServerId = localSession.serverId
      }

      const items = await db.transactionItems.where('transactionUuid').equals(tx.uuid).toArray()
      const splits = await db.paymentSplits.where('transactionUuid').equals(tx.uuid).toArray()

      const transactionItems = await Promise.all(
        items.map(async (item) => ({
          clientUuid: item.uuid,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCost: item.unitCost,
          totalPrice: item.totalPrice,
          productId: item.productUuid
            ? (await db.products.get(item.productUuid))?.serverId ?? null
            : null,
        }))
      );

      const body = {
        clientUuid: tx.uuid,
        sessionId: sessionServerId,
        buyerName: tx.buyerName,
        buyerPhone: tx.buyerPhone ?? undefined,
        items: tx.items,
        paymentMethod: tx.paymentMethod,
        amount: tx.amount,
        status: tx.status,
        transactionItems,
        paymentSplits: splits.map((split) => ({
          clientUuid: split.uuid,
          method: split.method,
          amount: split.amount,
        })),
      }

      const method = tx.serverId ? 'PATCH' : 'POST'
      const url = tx.serverId ? `/api/transactions/${tx.serverId}` : '/api/transactions'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        await markFailed('transactions', tx.uuid, `HTTP ${res.status}`)
        continue
      }

      const { transaction: serverTx } = await res.json()
      await db.transactions.update(tx.uuid, {
        serverId: serverTx.id,
        sessionServerId,
        syncStatus: 'synced',
        updatedAt: nowISO(),
      })

      // Mark items + splits synced
      if (serverTx.transactionItems) {
        for (const si of serverTx.transactionItems) {
          if (si.clientUuid) {
            await db.transactionItems.update(si.clientUuid, {
              serverId: si.id,
              syncStatus: 'synced',
              updatedAt: nowISO(),
            })
          }
        }
      }
      if (serverTx.paymentSplits) {
        for (const ss of serverTx.paymentSplits) {
          if (ss.clientUuid) {
            await db.paymentSplits.update(ss.clientUuid, {
              serverId: ss.id,
              syncStatus: 'synced',
              updatedAt: nowISO(),
            })
          }
        }
      }
    } catch (err) {
      await markFailed('transactions', tx.uuid, String(err))
    }
  }
}

// ─── Step 6: Sync Bills ───────────────────────────────────────────────────────

async function syncBills(): Promise<void> {
  const db = getDB()
  const pending = await db.bills
    .where('syncStatus')
    .anyOf(['pending', 'failed'])
    .filter((b) => (b.retryCount ?? 0) < MAX_RETRIES)
    .toArray()

  for (const bill of pending) {
    try {
      let providerServerId = bill.providerServerId
      if (!providerServerId) {
        const localProvider = await db.providers.get(bill.providerUuid)
        if (!localProvider?.serverId) continue // Provider not synced yet
        providerServerId = localProvider.serverId
      }

      const items = await db.billItems.where('billUuid').equals(bill.uuid).toArray()

      const body = {
        clientUuid: bill.uuid,
        totalAmount: bill.totalAmount,
        status: bill.status,
        date: bill.date,
        items: items.map((item) => ({
          clientUuid: item.uuid,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          sellPrice: item.sellPrice ?? null,
          total: item.total,
        })),
      }

      const res = await fetch(`/api/providers/${providerServerId}/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        await markFailed('bills', bill.uuid, `HTTP ${res.status}`)
        continue
      }

      const { bill: serverBill } = await res.json()
      await db.bills.update(bill.uuid, {
        serverId: serverBill.id,
        providerServerId,
        syncStatus: 'synced',
        updatedAt: nowISO(),
      })
    } catch (err) {
      await markFailed('bills', bill.uuid, String(err))
    }
  }
}

// ─── Step 7: Sync Provider Payments ──────────────────────────────────────────

async function syncProviderPayments(): Promise<void> {
  const db = getDB()
  const pending = await db.providerPayments
    .where('syncStatus')
    .anyOf(['pending', 'failed'])
    .filter((p) => (p.retryCount ?? 0) < MAX_RETRIES)
    .toArray()

  for (const payment of pending) {
    try {
      let providerServerId = payment.providerServerId
      if (!providerServerId) {
        const localProvider = await db.providers.get(payment.providerUuid)
        if (!localProvider?.serverId) continue
        providerServerId = localProvider.serverId
      }

      const res = await fetch(`/api/providers/${providerServerId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientUuid: payment.uuid,
          amount: payment.amount,
          date: payment.date,
        }),
      })

      if (!res.ok) {
        await markFailed('providerPayments', payment.uuid, `HTTP ${res.status}`)
        continue
      }

      const { payment: serverPayment } = await res.json()
      await db.providerPayments.update(payment.uuid, {
        serverId: serverPayment.id,
        providerServerId,
        syncStatus: 'synced',
        updatedAt: nowISO(),
      })
    } catch (err) {
      await markFailed('providerPayments', payment.uuid, String(err))
    }
  }
}

// ─── Step 8: Sync Deletions (pendingDelete) ─────────────────────────────────────

async function syncDeletions(): Promise<void> {
  const db = getDB()
  const tables: Array<{ table: string; url: string }> = [
    { table: 'sessions', url: '/api/sessions' },
    { table: 'products', url: '/api/products' },
    { table: 'customers', url: '/api/customers' },
    { table: 'providers', url: '/api/providers' },
    { table: 'transactions', url: '/api/transactions' },
    { table: 'bills', url: '/api/providers' }, // bills are under /api/providers/[id]/bills
    { table: 'providerPayments', url: '/api/providers' }, // payments are under /api/providers/[id]/payments
  ]

  for (const { table, url } of tables) {
    // @ts-expect-error - dynamic table access on Dexie database
    const pendingDelete = await db[table]
      .where('pendingDelete')
      .equals(true)
      .and((r: { serverId?: string; retryCount?: number }) => r.serverId && (r.retryCount ?? 0) < MAX_RETRIES)
      .toArray()

    for (const record of pendingDelete) {
      try {
        let deleteUrl = ''
        if (table === 'bills') {
          deleteUrl = `/api/providers/${record.providerServerId}/bills/${record.serverId}`
        } else if (table === 'providerPayments') {
          deleteUrl = `/api/providers/${record.providerServerId}/payments/${record.serverId}`
        } else {
          deleteUrl = `${url}/${record.serverId}`
        }

        const res = await fetch(deleteUrl, { method: 'DELETE' })

        if (!res.ok) {
          await markFailed(table as 'sessions' | 'transactions' | 'products' | 'customers' | 'providers' | 'bills' | 'providerPayments', record.uuid, `DELETE HTTP ${res.status}`)
          continue
        }

        // Hard delete locally on success
        // @ts-expect-error - dynamic table access on Dexie database
        await db[table].delete(record.uuid)
      } catch (err) {
        await markFailed(table as 'sessions' | 'transactions' | 'products' | 'customers' | 'providers' | 'bills' | 'providerPayments', record.uuid, String(err))
      }
    }
  }
}

// ─── Main sync runner ─────────────────────────────────────────────────────────

let isSyncing = false

export async function runSync(): Promise<void> {
  if (isSyncing) return
  if (!navigator.onLine) return
  if (typeof window === 'undefined') return

  isSyncing = true
  try {
    // Dependency order: sessions first, then referencing models
    await syncSessions()
    await syncProducts()
    await syncCustomers()
    await syncProviders()
    await syncTransactions()
    await syncBills()
    await syncProviderPayments()
    await syncDeletions()

    window.dispatchEvent(new CustomEvent('muhasiby:sync-complete'))
  } catch (err) {
    console.error('[SyncEngine] Unexpected error:', err)
  } finally {
    isSyncing = false
  }
}

export async function getPendingCount(): Promise<number> {
  if (typeof window === 'undefined') return 0
  const db = getDB()
  const counts = await Promise.all([
    db.sessions.where('syncStatus').equals('pending').count(),
    db.transactions.where('syncStatus').equals('pending').count(),
    db.products.where('syncStatus').equals('pending').count(),
    db.customers.where('syncStatus').equals('pending').count(),
    db.providers.where('syncStatus').equals('pending').count(),
    db.bills.where('syncStatus').equals('pending').count(),
    db.providerPayments.where('syncStatus').equals('pending').count(),
  ])
  return counts.reduce((a, b) => a + b, 0)
}

export async function getFailedCount(): Promise<number> {
  if (typeof window === 'undefined') return 0
  const db = getDB()
  const counts = await Promise.all([
    db.sessions.where('syncStatus').equals('failed').count(),
    db.transactions.where('syncStatus').equals('failed').count(),
    db.products.where('syncStatus').equals('failed').count(),
    db.customers.where('syncStatus').equals('failed').count(),
    db.providers.where('syncStatus').equals('failed').count(),
    db.bills.where('syncStatus').equals('failed').count(),
    db.providerPayments.where('syncStatus').equals('failed').count(),
  ])
  return counts.reduce((a, b) => a + b, 0)
}
