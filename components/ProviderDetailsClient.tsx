'use client'

import { useEffect, useState, useMemo } from 'react'
import { useLanguage } from '@/app/providers'
import type { Provider, Bill, ProviderPayment } from '@/lib/types'
import Link from 'next/link'

export default function ProviderDetailsClient({ providerId }: { providerId: string }) {
  const { t, locale } = useLanguage()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Add Bill Modal
  const [isAddingBill, setIsAddingBill] = useState(false)
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }])

  // Add Payment Modal
  const [isAddingPayment, setIsAddingPayment] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    void fetchProvider()
  }, [providerId])

  async function fetchProvider() {
    try {
      const response = await fetch(`/api/providers/${providerId}`)
      if (!response.ok) throw new Error('Failed')
      const data = await response.json()
      setProvider(data.provider)
    } catch {
      setError(t('providers.noProviders'))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddBill(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const validItems = items.filter(i => i.description.trim() !== '')
      if (validItems.length === 0) throw new Error('Needs items')
      const totalAmount = validItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)

      const response = await fetch(`/api/providers/${providerId}/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: validItems, totalAmount }),
      })
      if (!response.ok) throw new Error('Failed')
      
      setIsAddingBill(false)
      setItems([{ description: '', quantity: 1, unitPrice: 0 }])
      await fetchProvider()
    } catch {
      setError('Unable to add bill.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!paymentAmount || paymentAmount <= 0) return
    setIsSubmitting(true)
    setError(null)
    try {
      const response = await fetch(`/api/providers/${providerId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: paymentAmount }),
      })
      if (!response.ok) throw new Error('Failed')
      
      setIsAddingPayment(false)
      setPaymentAmount('')
      await fetchProvider()
    } catch {
      setError('Unable to add payment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleExport(type: 'excel' | 'pdf', billId?: string) {
    setExporting(true)
    try {
      const url = `/api/export/bills?providerId=${providerId}&type=${type}${billId ? `&billId=${billId}` : ''}&lang=${locale}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      const ext = type === 'excel' ? 'xlsx' : 'pdf'
      if (billId) {
        const now = new Date()
        const dateStr = now.toISOString().split('T')[0]
        const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`
        a.download = `${provider?.name}-${dateStr}-${timeStr}.${ext}`
      } else {
        a.download = `provider-${providerId}-ledger.${ext}`
      }
      a.click()
      URL.revokeObjectURL(objectUrl)
    } catch {
      setError('Unable to export.')
    } finally {
      setExporting(false)
    }
  }

  const billTotal = useMemo(() => items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0), [items])

  if (isLoading) {
    return <div className="p-10 text-center">Loading...</div>
  }

  if (!provider) {
    return <div className="p-10 text-center">Provider not found</div>
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <Link href="/providers" className="text-sm text-text-secondary hover:underline">
        &larr; {t('providers.title')}
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{provider.name}</h1>
          {provider.phone && <p className="text-sm text-text-secondary">{provider.phone}</p>}
          <p className={`mt-2 text-lg font-bold ${provider.totalDebt > 0 ? 'text-status-cancelled' : 'text-status-confirmed'}`}>
            {t('providers.totalDebt')}: {provider.totalDebt.toFixed(2)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-50"
          >
            {t('providers.exportAllPdf')}
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={exporting}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-50"
          >
            {t('providers.exportAllExcel')}
          </button>
          <button
            onClick={() => setIsAddingPayment(true)}
            className="rounded-xl bg-status-confirmed px-4 py-2 text-sm font-medium text-white transition hover:bg-status-confirmed/80"
          >
            {t('providers.addPayment')}
          </button>
          <button
            onClick={() => setIsAddingBill(true)}
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/80"
          >
            {t('providers.addBill')}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-status-cancelled bg-card px-4 py-3 text-sm text-status-cancelled">
          {error}
        </div>
      )}

      {/* Add Payment Form */}
      {isAddingPayment && (
        <form onSubmit={handleAddPayment} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">{t('providers.addPayment')}</h2>
          <div className="max-w-xs">
            <label className="mb-1 block text-xs font-medium text-text-secondary">{t('providers.paymentAmount')}</label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm focus:border-black focus:outline-none"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || '')}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setIsAddingPayment(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-text-secondary hover:bg-black/5">{t('providers.cancel')}</button>
            <button type="submit" disabled={isSubmitting} className="rounded-xl bg-status-confirmed px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{isSubmitting ? t('providers.saving') : t('providers.savePayment')}</button>
          </div>
        </form>
      )}

      {/* Add Bill Form */}
      {isAddingBill && (
        <form onSubmit={handleAddBill} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">{t('providers.addBill')}</h2>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="mb-1 block text-xs font-medium text-text-secondary">{t('providers.description')}</label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm focus:border-black focus:outline-none"
                    value={item.description}
                    onChange={(e) => {
                      const newItems = [...items]
                      newItems[index].description = e.target.value
                      setItems(newItems)
                    }}
                  />
                </div>
                <div className="w-24">
                  <label className="mb-1 block text-xs font-medium text-text-secondary">{t('providers.quantity')}</label>
                  <input
                    type="number"
                    required min="1"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm focus:border-black focus:outline-none"
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...items]
                      newItems[index].quantity = parseInt(e.target.value) || 0
                      setItems(newItems)
                    }}
                  />
                </div>
                <div className="w-32">
                  <label className="mb-1 block text-xs font-medium text-text-secondary">{t('providers.unitPrice')}</label>
                  <input
                    type="number"
                    required step="0.01" min="0"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm focus:border-black focus:outline-none"
                    value={item.unitPrice}
                    onChange={(e) => {
                      const newItems = [...items]
                      newItems[index].unitPrice = parseFloat(e.target.value) || 0
                      setItems(newItems)
                    }}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              className="text-xs font-medium text-black hover:underline"
              onClick={() => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }])}
            >
              + {t('providers.addItem')}
            </button>
          </div>
          
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <p className="font-semibold text-lg">{t('providers.total')}: {billTotal.toFixed(2)}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsAddingBill(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-text-secondary hover:bg-black/5">{t('providers.cancel')}</button>
              <button type="submit" disabled={isSubmitting || billTotal <= 0} className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{isSubmitting ? t('providers.saving') : t('providers.saveBill')}</button>
            </div>
          </div>
        </form>
      )}

      {/* Grid for Bills and Payments */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">{t('providers.bills')}</h2>
          <div className="space-y-4">
            {provider.bills?.length ? provider.bills.map(bill => (
              <div key={bill.id} className="rounded-xl border border-border bg-background p-4 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{t('providers.totalAmount')}: {bill.totalAmount.toFixed(2)}</p>
                    <p className="text-xs text-text-secondary">{new Date(bill.date).toLocaleDateString()}</p>
                  </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport('pdf', bill.id)}
                    className="text-xs font-medium text-text-secondary border border-border px-2 py-1 rounded hover:bg-black/5"
                  >
                    {t('providers.exportPdf')}
                  </button>
                  <button
                    onClick={() => handleExport('excel', bill.id)}
                    className="text-xs font-medium text-text-secondary border border-border px-2 py-1 rounded hover:bg-black/5"
                  >
                    {t('providers.exportExcel')}
                  </button>
                </div>
                </div>
                {/* Could optionally list items here */}
              </div>
            )) : <p className="text-sm text-text-secondary">{t('providers.noBills')}</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">{t('providers.payments')}</h2>
          <div className="space-y-4">
            {provider.payments?.length ? provider.payments.map(payment => (
              <div key={payment.id} className="rounded-xl border border-border bg-background p-4 flex justify-between items-center">
                <p className="font-semibold text-status-confirmed">{payment.amount.toFixed(2)}</p>
                <p className="text-xs text-text-secondary">{new Date(payment.date).toLocaleDateString()}</p>
              </div>
            )) : <p className="text-sm text-text-secondary">{t('providers.noPayments')}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
