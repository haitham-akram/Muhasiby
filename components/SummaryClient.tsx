'use client'

import { useEffect, useMemo, useState } from 'react'

import SummaryStats from '@/components/SummaryStats'
import { useLanguage } from '@/app/providers'
import type { Session, Transaction } from '@/lib/types'

export default function SummaryClient() {
  const { t, locale } = useLanguage()
  const currency = t('currency')
  const [session, setSession] = useState<Session | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const formatPaymentMethod = (methodStr: string) => {
    if (!methodStr) return ''
    return methodStr
      .split(' + ')
      .map((m) => t(`paymentMethods.${m}`) || m)
      .join(' + ')
  }

  useEffect(() => {
    void loadSession()
  }, [])

  async function loadSession() {
    setError(null)
    try {
      const response = await fetch('/api/sessions?today=true')
      if (!response.ok) {
        throw new Error('Failed')
      }
      const data = await response.json()
      setSession(data.session)
      if (data.session?.id) {
        const transactionsResponse = await fetch(`/api/transactions?sessionId=${data.session.id}`)
        if (transactionsResponse.ok) {
          const txData = await transactionsResponse.json()
          setTransactions(txData.transactions ?? [])
        }
      }
    } catch {
      setError('Unable to load summary data.')
    }
  }

  async function handleMarkConfirmed(id: string) {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      })
      if (!response.ok) {
        throw new Error('Failed')
      }
      const data = await response.json()
      setTransactions((prev) => prev.map((item) => (item.id === id ? data.transaction : item)))
    } catch {
      setError('Unable to update transaction.')
    }
  }

  async function handleExportPdf(type: 'summary' | 'receipts') {
    if (!session?.id) return
    setIsExporting(true)
    try {
      const url = `/api/export?sessionId=${session.id}&type=${type === 'summary' ? 'summary' : 'receipt'}&lang=${locale}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      
      const now = new Date()
      const dateStr = session.date ? new Date(session.date).toISOString().split('T')[0] : now.toISOString().split('T')[0]
      const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`
      
      a.download = type === 'summary' ? `سجل يوم-${dateStr}-${timeStr}.pdf` : `receipts.pdf`
      a.click()
      URL.revokeObjectURL(objectUrl)
    } catch {
      setError('Unable to export PDF.')
    } finally {
      setIsExporting(false)
    }
  }

  const stats = useMemo(() => {
    const totals = {
      totalTransactions: transactions.length,
      totalConfirmed: 0,
      totalPending: 0,
      totalCancelled: 0,
      totalProfit: 0,
    }
    transactions.forEach((tx) => {
      if (tx.status === 'CONFIRMED') {
        totals.totalConfirmed += tx.amount
        
        let txCost = 0
        if (tx.transactionItems && tx.transactionItems.length > 0) {
          tx.transactionItems.forEach((item) => {
            txCost += (item.unitCost || 0) * item.quantity
          })
        }
        totals.totalProfit += (tx.amount - txCost)
      } else if (tx.status === 'PENDING') {
        totals.totalPending += tx.amount
      } else {
        totals.totalCancelled += tx.amount
      }
    })
    return totals
  }, [transactions])

  const breakdown = useMemo(() => {
    const map = new Map<string, number>()
    transactions.forEach((tx) => {
      map.set(tx.paymentMethod, (map.get(tx.paymentMethod) ?? 0) + tx.amount)
    })
    return Array.from(map.entries())
  }, [transactions])

  const pendingTransactions = transactions.filter((tx) => tx.status === 'PENDING')

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{t('summaryClient.title')}</h1>
          <p className="text-sm text-text-secondary">
            {session ? t('summaryClient.reviewTotals') : t('summaryClient.noSession')}
          </p>
        </div>
        {session ? (
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-black disabled:opacity-60 hover:bg-black hover:text-white transition-colors"
              onClick={() => handleExportPdf('summary')}
              disabled={isExporting}
            >
              {isExporting ? t('summaryClient.exporting') : t('summaryClient.exportSummaryPdf')}
            </button>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-status-cancelled bg-card px-4 py-3 text-sm text-status-cancelled">
          {error}
        </div>
      ) : null}

      <SummaryStats {...stats} />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{t('summaryClient.breakdown')}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {breakdown.length ? (
            breakdown.map(([method, amount]) => (
              <div key={method} className="rounded-xl border border-border bg-background px-4 py-3 text-sm">
                <p className="text-text-secondary">{formatPaymentMethod(method)}</p>
                <p className="text-lg font-semibold">{amount.toFixed(2)} {t('currency')}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-text-secondary">{t('summaryClient.noPayments')}</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{t('summaryClient.pendingFollowUp')}</h2>
        {pendingTransactions.length ? (
          <>
            <div className="mt-4 md:hidden">
              <div className="divide-y divide-border rounded-xl border border-border bg-card">
                {pendingTransactions.map((tx) => (
                  <div key={tx.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-medium">{tx.buyerName}</p>
                      <p className="text-xs uppercase text-text-secondary">{t('summaryClient.pendingStatus')}</p>
                    </div>
                    <dl className="mt-3 grid gap-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-text-secondary">{t('transactionForm.phoneNumber')}</dt>
                        <dd className="text-right text-text-secondary">{tx.buyerPhone || '—'}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-text-secondary">{t('transactionTable.amount')}</dt>
                        <dd className="text-right">{tx.amount.toFixed(2)} {currency}</dd>
                      </div>
                    </dl>
                    <div className="mt-4 flex justify-end">
                      <button
                        className="text-xs font-medium text-status-confirmed"
                        onClick={() => handleMarkConfirmed(tx.id)}
                      >
                        {t('summaryClient.markConfirmed')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 hidden overflow-x-auto rounded-xl border border-border md:block">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-background text-xs uppercase text-text-secondary">
                  <tr>
                    <th className="px-4 py-3">{t('transactionTable.buyerName')}</th>
                    <th className="px-4 py-3">{t('transactionForm.phoneNumber')}</th>
                    <th className="px-4 py-3">{t('transactionTable.amount')}</th>
                    <th className="px-4 py-3">{t('transactionTable.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTransactions.map((tx) => (
                    <tr key={tx.id} className="border-t border-border">
                      <td className="px-4 py-3">{tx.buyerName}</td>
                      <td className="px-4 py-3 text-text-secondary">{tx.buyerPhone || '—'}</td>
                      <td className="px-4 py-3">{tx.amount.toFixed(2)} {currency}</td>
                      <td className="px-4 py-3">
                        <button
                          className="text-xs font-medium text-status-confirmed"
                          onClick={() => handleMarkConfirmed(tx.id)}
                        >
                          {t('summaryClient.markConfirmed')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-text-secondary">{t('summaryClient.noPending')}</p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{t('summaryClient.recentTransactions')}</h2>
        {transactions.length ? (
          <>
            <div className="mt-4 md:hidden">
              <div className="divide-y divide-border rounded-xl border border-border bg-card">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-medium">{tx.buyerName}</p>
                      <p className="text-xs uppercase text-text-secondary">{t(`statusBadge.${tx.status}`)}</p>
                    </div>
                    <dl className="mt-3 grid gap-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-text-secondary">{t('transactionTable.paymentMethod')}</dt>
                        <dd className="text-right">{formatPaymentMethod(tx.paymentMethod)}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-text-secondary">{t('transactionTable.amount')}</dt>
                        <dd className="text-right">{tx.amount.toFixed(2)} {currency}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 hidden overflow-x-auto rounded-xl border border-border md:block">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-background text-xs uppercase text-text-secondary">
                  <tr>
                    <th className="px-4 py-3">{t('transactionTable.buyerName')}</th>
                    <th className="px-4 py-3">{t('transactionTable.paymentMethod')}</th>
                    <th className="px-4 py-3">{t('transactionTable.amount')}</th>
                    <th className="px-4 py-3">{t('transactionTable.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-t border-border">
                      <td className="px-4 py-3">{tx.buyerName}</td>
                      <td className="px-4 py-3">{formatPaymentMethod(tx.paymentMethod)}</td>
                      <td className="px-4 py-3">{tx.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-text-secondary">{t(`statusBadge.${tx.status}`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-text-secondary">{t('summaryClient.noTransactions')}</p>
        )}
      </div>
    </div>
  )
}
