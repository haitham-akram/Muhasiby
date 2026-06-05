'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import FilterBar from '@/components/FilterBar'
import FilterChip from '@/components/FilterChip'
import { useLanguage } from '@/app/providers'
import SearchBar from '@/components/SearchBar'
import type { Session, Transaction } from '@/lib/types'

const defaultMethods = ['Bank Transfer', 'Wallet', 'Cash']

export default function HistoryClient() {
  const { t, locale } = useLanguage()
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionTransactions, setSessionTransactions] = useState<Record<string, Transaction[]>>({})
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [method, setMethod] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [results, setResults] = useState<Transaction[]>([])
  const [error, setError] = useState<string | null>(null)
  const [exportingSessionId, setExportingSessionId] = useState<string | null>(null)

  const hasFilters = Boolean(search || status || method || from || to)

  useEffect(() => {
    void loadSessions()
  }, [])

  async function loadSessions() {
    setError(null)
    try {
      const response = await fetch('/api/sessions')
      if (!response.ok) {
        throw new Error('Failed')
      }
      const data = await response.json()
      setSessions(data.sessions ?? [])
    } catch {
      setError('Unable to load sessions.')
    }
  }

  const fetchResults = useCallback(async () => {
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      if (method) params.set('method', method)
      if (from) params.set('from', from)
      if (to) params.set('to', to)

      const response = await fetch(`/api/transactions?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed')
      }
      const data = await response.json()
      setResults(data.transactions ?? [])
    } catch {
      setError('Unable to load filtered results.')
    }
  }, [search, status, method, from, to])

  useEffect(() => {
    if (!hasFilters) {
      setResults([])
      return
    }

    const timeout = setTimeout(() => {
      void fetchResults()
    }, 300)

    return () => clearTimeout(timeout)
  }, [search, status, method, from, to, hasFilters, fetchResults])

  async function toggleSession(sessionId: string) {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null)
      return
    }

    setExpandedSessionId(sessionId)
    if (sessionTransactions[sessionId]) {
      return
    }

    try {
      const response = await fetch(`/api/transactions?sessionId=${sessionId}`)
      if (!response.ok) {
        throw new Error('Failed')
      }
      const data = await response.json()
      setSessionTransactions((prev) => ({
        ...prev,
        [sessionId]: data.transactions ?? [],
      }))
    } catch {
      setError('Unable to load session transactions.')
    }
  }

  async function handleExportPdf(sessionId: string, sessionDate: string | Date) {
    setExportingSessionId(sessionId)
    try {
      const response = await fetch(`/api/export?sessionId=${sessionId}&type=summary&lang=${locale}`)
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl

      const now = new Date()
      const dateStr = new Date(sessionDate).toISOString().split('T')[0]
      const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`

      a.download = `سجل يوم-${dateStr}-${timeStr}.pdf`
      a.click()
      URL.revokeObjectURL(objectUrl)
    } catch {
      setError('Unable to export PDF.')
    } finally {
      setExportingSessionId(null)
    }
  }

  const methods = useMemo(() => {
    const methodSet = new Set(defaultMethods)
    results.forEach((tx) => methodSet.add(tx.paymentMethod))
    Object.values(sessionTransactions).forEach((list) => list.forEach((tx) => methodSet.add(tx.paymentMethod)))
    return Array.from(methodSet)
  }, [results, sessionTransactions])

  const groupedResults = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    results.forEach((tx) => {
      const dateKey = new Date(tx.createdAt).toLocaleDateString()
      if (!map.has(dateKey)) {
        map.set(dateKey, [])
      }
      map.get(dateKey)?.push(tx)
    })
    return Array.from(map.entries())
  }, [results])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold">{t('history.title')}</h1>
        <p className="text-sm text-text-secondary">{t('history.subtitle')}</p>
      </div>

      <SearchBar value={search} onChange={setSearch} />
      <FilterBar
        status={status}
        method={method}
        from={from}
        to={to}
        methods={methods}
        onStatusChange={setStatus}
        onMethodChange={setMethod}
        onFromChange={setFrom}
        onToChange={setTo}
        onClear={() => {
          setSearch('')
          setStatus('')
          setMethod('')
          setFrom('')
          setTo('')
        }}
      />

      <div className="flex flex-wrap gap-2">
        {search ? <FilterChip label={`${t('filterBar.search')}: ${search}`} onRemove={() => setSearch('')} /> : null}
        {status ? <FilterChip label={`${t('filterBar.status')}: ${status}`} onRemove={() => setStatus('')} /> : null}
        {method ? (
          <FilterChip label={`${t('filterBar.paymentMethod')}: ${method}`} onRemove={() => setMethod('')} />
        ) : null}
        {from ? <FilterChip label={`${t('filterBar.from')}: ${from}`} onRemove={() => setFrom('')} /> : null}
        {to ? <FilterChip label={`${t('filterBar.to')}: ${to}`} onRemove={() => setTo('')} /> : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-status-cancelled bg-card px-4 py-3 text-sm text-status-cancelled">
          {error}
        </div>
      ) : null}

      {hasFilters ? (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-text-secondary">
            {results.length} {t('history.transactionsFound')}
          </p>
          {groupedResults.length ? (
            <div className="mt-4 space-y-6">
              {groupedResults.map(([date, items]) => (
                <div key={date}>
                  <h3 className="text-sm font-semibold text-text-secondary">{date}</h3>
                  <div className="mt-2 md:hidden">
                    <div className="divide-y divide-border rounded-xl border border-border bg-card">
                      {items.map((tx) => (
                        <div key={tx.id} className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <p className="font-medium">{tx.buyerName}</p>
                            <p className="text-xs uppercase text-text-secondary">{tx.status}</p>
                          </div>
                          <dl className="mt-3 grid gap-2 text-sm">
                            <div className="flex items-center justify-between gap-3">
                              <dt className="text-text-secondary">{t('transactionTable.amount')}</dt>
                              <dd>{tx.amount.toFixed(2)}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <dt className="text-text-secondary">{t('transactionTable.paymentMethod')}</dt>
                              <dd>{tx.paymentMethod}</dd>
                            </div>
                          </dl>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 hidden overflow-x-auto rounded-xl border border-border md:block">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-background text-xs uppercase text-text-secondary">
                        <tr>
                          <th className="px-4 py-3">{t('transactionTable.buyerName')}</th>
                          <th className="px-4 py-3">{t('transactionTable.amount')}</th>
                          <th className="px-4 py-3">{t('transactionTable.paymentMethod')}</th>
                          <th className="px-4 py-3">{t('transactionTable.status')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((tx) => (
                          <tr key={tx.id} className="border-t border-border">
                            <td className="px-4 py-3">{tx.buyerName}</td>
                            <td className="px-4 py-3">{tx.amount.toFixed(2)}</td>
                            <td className="px-4 py-3">{tx.paymentMethod}</td>
                            <td className="px-4 py-3 text-text-secondary">{tx.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-text-secondary">{t('history.noMatchingTransactions')}</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.length ? (
            sessions.map((session) => {
              const isExpanded = expandedSessionId === session.id
              const items = sessionTransactions[session.id] ?? []
              return (
                <div key={session.id} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-secondary">{t('history.session')}</p>
                      <p className="text-lg font-semibold">{new Date(session.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-text-secondary hover:border-black hover:text-black transition-colors disabled:opacity-50"
                        onClick={() => handleExportPdf(session.id, session.date)}
                        disabled={exportingSessionId === session.id}
                      >
                        {exportingSessionId === session.id ? t('history.exporting') : t('history.exportPdf')}
                      </button>
                      <button
                        className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-text-secondary hover:border-black hover:text-black transition-colors"
                        onClick={() => toggleSession(session.id)}
                      >
                        {isExpanded ? t('history.hideTransactions') : t('history.viewTransactions')}
                      </button>
                    </div>
                  </div>
                  {isExpanded ? (
                    <div className="mt-4 overflow-x-auto rounded-xl border border-border">
                      <div className="md:hidden">
                        {items.length ? (
                          <div className="divide-y divide-border rounded-xl border border-border bg-card">
                            {items.map((tx) => (
                              <div key={tx.id} className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <p className="font-medium">{tx.buyerName}</p>
                                  <p className="text-xs uppercase text-text-secondary">{tx.status}</p>
                                </div>
                                <dl className="mt-3 grid gap-2 text-sm">
                                  <div className="flex items-center justify-between gap-3">
                                    <dt className="text-text-secondary">{t('transactionTable.amount')}</dt>
                                    <dd>{tx.amount.toFixed(2)}</dd>
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <dt className="text-text-secondary">{t('transactionTable.paymentMethod')}</dt>
                                    <dd>{tx.paymentMethod}</dd>
                                  </div>
                                </dl>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-border bg-card p-4 text-sm text-text-secondary">
                            {t('history.noTransactionsYet')}
                          </div>
                        )}
                      </div>
                      <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-background text-xs uppercase text-text-secondary">
                            <tr>
                              <th className="px-4 py-3">{t('transactionTable.buyerName')}</th>
                              <th className="px-4 py-3">{t('transactionTable.amount')}</th>
                              <th className="px-4 py-3">{t('transactionTable.paymentMethod')}</th>
                              <th className="px-4 py-3">{t('transactionTable.status')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.length ? (
                              items.map((tx) => (
                                <tr key={tx.id} className="border-t border-border">
                                  <td className="px-4 py-3">{tx.buyerName}</td>
                                  <td className="px-4 py-3">{tx.amount.toFixed(2)}</td>
                                  <td className="px-4 py-3">{tx.paymentMethod}</td>
                                  <td className="px-4 py-3 text-text-secondary">{tx.status}</td>
                                </tr>
                              ))
                            ) : (
                              <tr className="border-t border-border">
                                <td className="px-4 py-3 text-text-secondary" colSpan={4}>
                                  {t('history.noTransactionsYet')}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })
          ) : (
            <div className="rounded-2xl border border-border bg-card p-6 text-sm text-text-secondary">
              {t('history.noSessions')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
