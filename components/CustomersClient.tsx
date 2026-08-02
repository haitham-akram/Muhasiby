'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/app/providers'
import { useCustomers } from '@/hooks/useCustomers'
import { useTransactions } from '@/hooks/useTransactions'
import { format } from 'date-fns'

type CustomerAggregated = {
  id: string
  uuid: string
  name: string
  phone: string
  totalSpent: number
  pendingBalance: number
  lastVisit: string
}

export default function CustomersClient() {
  const { t } = useLanguage()

  const { customers, isLoading: customersLoading } = useCustomers()
  const { transactions, isLoading: transactionsLoading } = useTransactions()

  const [aggregatedCustomers, setAggregatedCustomers] = useState<CustomerAggregated[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function computeAggregates() {
      // Wait for both to load
      if (customersLoading || transactionsLoading) return

      const aggregates: CustomerAggregated[] = customers.map(customer => {
        const customerTransactions = transactions.filter(
          t => t.buyerPhone === customer.phone && t.buyerPhone
        )
        
        let totalSpent = 0
        let pendingBalance = 0
        let lastVisit = customer.createdAt

        for (const tx of customerTransactions) {
          if (tx.createdAt > lastVisit) lastVisit = tx.createdAt
          if (tx.status === 'CONFIRMED') totalSpent += tx.amount
          if (tx.status === 'PENDING') pendingBalance += tx.amount
        }

        return {
          id: customer.serverId ?? customer.uuid,
          uuid: customer.uuid,
          name: customer.name,
          phone: customer.phone,
          totalSpent,
          pendingBalance,
          lastVisit,
        }
      })

      setAggregatedCustomers(aggregates)
      setIsLoading(false)
    }

    computeAggregates()
  }, [customers, transactions, customersLoading, transactionsLoading])

  // If online, also try to fetch from server for the most up-to-date aggregates
  useEffect(() => {
    if (!navigator.onLine) return
    
    async function fetchServerAggregates() {
      try {
        const res = await fetch('/api/customers')
        if (res.ok) {
          const data = await res.json()
          const serverCustomers = data.customers ?? data
          setAggregatedCustomers(serverCustomers)
        }
      } catch {
        // Use local aggregates
      }
    }
    
    fetchServerAggregates()
  }, [customers]) // Re-fetch when local customers change (new customer added)

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{t('customers.title') || 'Customers'}</h1>
          <p className="text-sm text-text-secondary">{t('customers.subtitle') || 'Customer ledger and debt tracking.'}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-text-secondary">Loading...</div>
        ) : aggregatedCustomers.length === 0 ? (
          <div className="p-6 text-sm text-text-secondary">No customers found.</div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden p-4 space-y-4">
              {aggregatedCustomers.map((c) => (
                <div key={c.id} className="rounded-xl border border-border bg-white dark:bg-card p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-text-primary">{c.name}</h3>
                  </div>
                  <p className="text-sm text-text-secondary">{c.phone}</p>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                    <div className="text-center">
                      <p className="text-xs text-text-secondary">{t('customers.totalSpent') || 'Total Spent'}</p>
                      <p className="font-semibold text-status-confirmed">{c.totalSpent.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-text-secondary">{t('customers.pendingBalance') || 'Pending'}</p>
                      <p className="font-semibold text-status-pending">{c.pendingBalance.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-text-secondary">{t('customers.lastVisit') || 'Last Visit'}</p>
                      <p className="text-sm text-text-secondary">{format(new Date(c.lastVisit), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-background text-xs uppercase text-text-secondary">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Total Spent</th>
                    <th className="px-6 py-4">Pending Balance</th>
                    <th className="px-6 py-4">Last Visit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {aggregatedCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer">
                      <td className="px-6 py-4 font-medium text-text-primary">{c.name}</td>
                      <td className="px-6 py-4 text-text-secondary">{c.phone}</td>
                      <td className="px-6 py-4 text-status-confirmed">{c.totalSpent.toFixed(2)}</td>
                      <td className="px-6 py-4 text-status-pending">{c.pendingBalance.toFixed(2)}</td>
                      <td className="px-6 py-4 text-text-secondary">{format(new Date(c.lastVisit), 'dd MMM yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  )
}