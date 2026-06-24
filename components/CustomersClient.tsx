'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { useLanguage } from '@/app/providers'
import { format } from 'date-fns'

type CustomerAggregated = {
  id: string
  name: string
  phone: string
  totalSpent: number
  pendingBalance: number
  lastVisit: string
}

export default function CustomersClient() {
  const { t } = useLanguage()
  const { data, error, mutate } = useSWR<{ customers: CustomerAggregated[] }>('/api/customers', fetcher)

  const customers = data?.customers || []
  const isLoading = !data && !error

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
        ) : customers.length === 0 ? (
          <div className="p-6 text-sm text-text-secondary">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
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
                {customers.map((c) => (
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
        )}
      </div>
    </main>
  )
}
