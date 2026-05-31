'use client'

import { useCallback, useEffect, useState } from 'react'

import TransactionForm from '@/components/TransactionForm'
import TransactionTable from '@/components/TransactionTable'
import type { Session, Transaction, TransactionStatus } from '@/lib/types'
import { useLanguage } from '@/app/providers'

type TransactionFormValues = {
  buyerName: string
  items: string
  paymentMethod: string
  amount: number
  status: TransactionStatus
  buyerPhone?: string
}

export default function DashboardClient() {
  const { t } = useLanguage()
  const [session, setSession] = useState<Session | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const loadTransactions = useCallback(async (sessionId: string) => {
    const response = await fetch(`/api/transactions?sessionId=${sessionId}`)
    if (!response.ok) {
      throw new Error('Failed to load transactions')
    }
    const data = await response.json()
    setTransactions(data.transactions ?? [])
  }, [])

  const loadSession = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/sessions?today=true')
      if (!response.ok) {
        throw new Error('Failed to load session')
      }
      const data = await response.json()
      setSession(data.session)
      if (data.session?.id) {
        await loadTransactions(data.session.id)
      } else {
        setTransactions([])
      }
    } catch {
      setError('Unable to load session data.')
    } finally {
      setIsLoading(false)
    }
  }, [loadTransactions])

  useEffect(() => {
    void loadSession()
  }, [loadSession])

  async function handleOpenSession() {
    setIsCreatingSession(true)
    setError(null)
    try {
      const response = await fetch('/api/sessions', { method: 'POST' })
      if (!response.ok) {
        throw new Error('Failed to open session')
      }
      const data = await response.json()
      setSession(data.session)
      if (data.session?.id) {
        await loadTransactions(data.session.id)
      }
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

      if (!response.ok) {
        throw new Error('Failed to add transaction')
      }

      const data = await response.json()
      setTransactions((prev) => [data.transaction, ...prev])
      setIsDrawerOpen(false) // Close drawer on success
    } catch {
      setError('Unable to add transaction.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleStatus(transaction: Transaction, nextStatus: TransactionStatus) {
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      const data = await response.json()
      setTransactions((prev) => prev.map((item) => (item.id === transaction.id ? data.transaction : item)))
    } catch {
      setError('Unable to update status.')
    }
  }

  async function handleDelete(transaction: Transaction) {
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete transaction')
      }
      setTransactions((prev) => prev.filter((item) => item.id !== transaction.id))
    } catch {
      setError('Unable to delete transaction.')
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
            className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
            onClick={handleOpenSession}
            disabled={isCreatingSession}
          >
            {isCreatingSession ? t('dashboard.openingBtn') : t('dashboard.openSessionBtn')}
          </button>
        ) : (
          <button
            className="hidden md:block rounded-xl bg-black px-4 py-2 text-sm text-white"
            onClick={() => {
              // Smooth scroll to the inline form on desktop
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            {t('dashboard.newTransaction')}
          </button>
        )}
      </div>

      {error ? (
        <div className="rounded-2xl border border-status-cancelled bg-card px-4 py-3 text-sm text-status-cancelled">
          {error}
        </div>
      ) : null}

      {isLoading ? <div className="text-sm text-text-secondary">{t('dashboard.loadingSession')}</div> : null}

      {session ? (
        <>
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
                className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-black text-xl leading-none"
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
            className="fixed bottom-20 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-lg transition-transform active:scale-95 md:hidden"
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
      ) : null}
    </main>
  )
}
