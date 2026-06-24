'use client'

import { useState } from 'react'
import { useSession } from '@/hooks/useSession'
import { useTransactions } from '@/hooks/useTransactions'
import TransactionForm from '@/components/TransactionForm'
import TransactionTable from '@/components/TransactionTable'
import StatsBar from '@/components/StatsBar'
import type { Transaction, TransactionStatus, PaymentSplit } from '@/lib/types'
import { useLanguage } from '@/app/providers'
import { mutate } from 'swr'

type TransactionFormValues = {
  buyerName: string
  items: string
  paymentMethod: string
  paymentSplits?: PaymentSplit[]
  amount: number
  status: TransactionStatus
  buyerPhone?: string
}

export default function DashboardClient() {
  const { t } = useLanguage()
  const { session, isLoading: isSessionLoading, mutateSession } = useSession()
  const { transactions, isLoading: isTransactionsLoading, mutateTransactions } = useTransactions(session?.id)
  
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const isLoading = isSessionLoading || isTransactionsLoading

  async function handleOpenSession() {
    setIsCreatingSession(true)
    setError(null)
    try {
      const response = await fetch('/api/sessions', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to open session')
      await mutateSession() // Refetch session
    } catch {
      setError('Unable to open a new session.')
    } finally {
      setIsCreatingSession(false)
    }
  }

  async function handleAddTransaction(values: TransactionFormValues) {
    if (!session?.id) {
      setError('Open a session before adding transactions.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    // Optimistic transaction
    const optimisticTx: Transaction = {
      id: `temp-${Date.now()}`,
      sessionId: session.id,
      buyerName: values.buyerName,
      buyerPhone: values.buyerPhone || null,
      items: values.items,
      paymentMethod: values.paymentMethod,
      paymentSplits: values.paymentSplits,
      amount: values.amount,
      status: values.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Mutate immediately, but don't revalidate yet
    mutateTransactions({ transactions: [optimisticTx, ...transactions] }, false)
    setIsDrawerOpen(false)

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          ...values,
          buyerPhone: values.buyerPhone || undefined,
        }),
      })

      if (!response.ok) throw new Error('Failed to add transaction')
      
      // Revalidate to get the real transaction with correct ID and DB data
      await mutateTransactions()
      // Also mutate stats to trigger re-fetch of StatsBar metrics
      mutate(`/api/stats?sessionId=${session.id}`)
    } catch {
      setError('Unable to add transaction.')
      // Revert optimistic update
      await mutateTransactions()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleStatus(transaction: Transaction, nextStatus: TransactionStatus) {
    // Optimistic update
    const updatedTransactions = transactions.map(item => 
      item.id === transaction.id ? { ...item, status: nextStatus } : item
    )
    mutateTransactions({ transactions: updatedTransactions }, false)

    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })

      if (!response.ok) throw new Error('Failed to update status')
      
      await mutateTransactions()
      mutate(`/api/stats?sessionId=${session?.id}`)
    } catch {
      setError('Unable to update status.')
      await mutateTransactions()
    }
  }

  async function handleDelete(transaction: Transaction) {
    // Optimistic update
    const updatedTransactions = transactions.filter(item => item.id !== transaction.id)
    mutateTransactions({ transactions: updatedTransactions }, false)

    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete transaction')
      
      await mutateTransactions()
      mutate(`/api/stats?sessionId=${session?.id}`)
    } catch {
      setError('Unable to delete transaction.')
      await mutateTransactions()
    }
  }

  const sessionStatus = session?.closedAt ? t('dashboard.statusClosed') : t('dashboard.statusOpen')

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
          <StatsBar sessionId={session.id} />

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

          <TransactionTable transactions={transactions} onToggleStatus={handleToggleStatus} onDelete={handleDelete} />

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
