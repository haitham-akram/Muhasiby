'use client'

import { useState } from 'react'
import { useSession } from '@/hooks/useSession'
import { useTransactions } from '@/hooks/useTransactions'
import TransactionForm from '@/components/TransactionForm'
import TransactionTable from '@/components/TransactionTable'
import StatsBar from '@/components/StatsBar'
import { useLanguage } from '@/app/providers'
import type { LocalTransactionWithDetails } from '@/lib/local/transactionRepo'
import type { PaymentSplit } from '@/lib/types'
import { useSession as useNextAuthSession } from 'next-auth/react'

import { z } from 'zod'
import { TransactionSchema } from '@/lib/validations'

type TransactionFormValues = z.infer<typeof TransactionSchema>

export default function DashboardClient() {
  const { t } = useLanguage()
  const { data: authData } = useNextAuthSession()

  const {
    session,
    isLoading: isSessionLoading,
    mutateSession,
    openSession,
    closeSession,
  } = useSession()

  const {
    transactions,
    isLoading: isTransactionsLoading,
    mutateTransactions,
    addTransaction,
    toggleStatus,
    removeTransaction,
  } = useTransactions(session?.uuid)

  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const isLoading = isSessionLoading || isTransactionsLoading

  async function handleOpenSession() {
    setIsCreatingSession(true)
    setError(null)
    try {
      await openSession()
    } catch {
      setError('Unable to open a new session.')
    } finally {
      setIsCreatingSession(false)
    }
  }

  async function handleAddTransaction(values: TransactionFormValues) {
    if (!session?.uuid) {
      setError('Open a session before adding transactions.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setIsDrawerOpen(false)

    try {
      await addTransaction({
        sessionUuid: session.uuid,
        sessionServerId: session.serverId,
        buyerName: values.buyerName,
        buyerPhone: values.buyerPhone || undefined,
        items: values.items,
        paymentMethod: values.paymentMethod,
        amount: values.amount,
        status: values.status,
        transactionItems: values.transactionItems?.map((item) => ({
          productUuid: item.productId ?? undefined, // productId here is actually the local uuid
          name: item.name,
          quantity: item.quantity,
          unitCost: 0, // Will be resolved during sync
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
        paymentSplits: values.paymentSplits?.map((split) => ({
          method: split.method,
          amount: split.amount,
        })),
      })

      // Invalidate stats if online
      if (navigator.onLine && session.serverId) {
        fetch(`/api/stats?sessionId=${session.serverId}`).catch(() => {})
      }
    } catch {
      setError('Unable to add transaction.')
      await mutateTransactions()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleStatus(
    transaction: LocalTransactionWithDetails,
    nextStatus: 'CONFIRMED' | 'PENDING' | 'CANCELLED'
  ) {
    await toggleStatus(transaction.uuid, nextStatus)

    // Background sync if online and we have a serverId
    if (navigator.onLine && transaction.serverId) {
      fetch(`/api/transactions/${transaction.serverId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      }).catch(() => {})
    }
  }

  async function handleDelete(transaction: LocalTransactionWithDetails) {
    await removeTransaction(transaction.uuid)

    if (navigator.onLine && transaction.serverId) {
      fetch(`/api/transactions/${transaction.serverId}`, { method: 'DELETE' }).catch(() => {})
    }
  }

  const sessionStatus = session?.closedAt ? t('dashboard.statusClosed') : t('dashboard.statusOpen')

  // Adapt local transactions to the shape TransactionTable expects (uses `id` field)
  const adaptedTransactions = transactions.map((tx) => ({
    id: tx.serverId ?? tx.uuid,
    sessionId: tx.serverId ?? tx.uuid,
    buyerName: tx.buyerName,
    buyerPhone: tx.buyerPhone ?? null,
    items: tx.items,
    paymentMethod: tx.paymentMethod,
    paymentSplits: tx.paymentSplits.map((s) => ({ id: s.serverId ?? s.uuid, method: s.method, amount: s.amount })),
    transactionItems: tx.transactionItems.map((i) => ({
      id: i.serverId ?? i.uuid,
      transactionId: tx.serverId ?? tx.uuid,
      productId: i.productUuid ?? null,
      name: i.name,
      quantity: i.quantity,
      unitCost: i.unitCost,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
    })),
    amount: tx.amount,
    status: tx.status,
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
    _localUuid: tx.uuid,
    _syncStatus: tx.syncStatus,
  }))

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{t('dashboard.title')}</h1>
          <p className="text-sm text-text-secondary">
            {session ? `${t('dashboard.status')}${sessionStatus}` : t('dashboard.openPrompt')}
          </p>
        </div>
        {!session ? (
          <button
            className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-black"
            onClick={handleOpenSession}
            disabled={isCreatingSession}
          >
            {isCreatingSession ? t('dashboard.openingBtn') : t('dashboard.openSessionBtn')}
          </button>
        ) : (
          <button
            className="hidden md:block rounded-xl bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            {t('dashboard.newTransaction')}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-status-cancelled bg-card px-4 py-3 text-sm text-status-cancelled">
          {error}
        </div>
      )}

      {isLoading && <div className="text-sm text-text-secondary">{t('dashboard.loadingSession')}</div>}

      {session && (
        <>
          <StatsBar sessionId={session.serverId ?? session.uuid} />

          {/* Mobile Overlay */}
          {isDrawerOpen && (
            <div
              className="fixed inset-0 z-[60] bg-black/40 transition-opacity md:hidden"
              onClick={() => setIsDrawerOpen(false)}
            />
          )}

          {/* Drawer Container */}
          <div
            className={`fixed inset-x-0 bottom-0 z-[70] transform rounded-t-3xl bg-background p-6 shadow-2xl transition-transform duration-300 md:relative md:inset-auto md:z-auto md:block md:transform-none md:rounded-none md:bg-transparent md:p-0 md:shadow-none ${
              isDrawerOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'
            }`}
          >
            <div className="mb-6 flex items-center justify-between md:hidden">
              <h2 className="text-xl font-semibold">{t('dashboard.newTransaction')}</h2>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-black text-xl leading-none dark:bg-neutral-800 dark:text-white"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <TransactionForm onSubmit={handleAddTransaction} isSubmitting={isSubmitting} />
          </div>

          <TransactionTable
            transactions={adaptedTransactions as Parameters<typeof TransactionTable>[0]['transactions']}
            onToggleStatus={(tx, status) => {
              const local = transactions.find((t) => (t.serverId ?? t.uuid) === tx.id)
              if (local) handleToggleStatus(local, status)
            }}
            onDelete={(tx) => {
              const local = transactions.find((t) => (t.serverId ?? t.uuid) === tx.id)
              if (local) handleDelete(local)
            }}
          />

          {/* Floating Action Button (Mobile) */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="fixed bottom-20 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-lg transition-transform active:scale-95 md:hidden dark:bg-white dark:text-black"
            aria-label="Add Transaction"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </>
      )}
    </main>
  )
}
