'use client'

import { useEffect, useState, useMemo } from 'react'
import { useLanguage } from '@/app/providers'
import type { Provider, Bill, ProviderPayment } from '@/lib/types'
import Link from 'next/link'

type Product = {
  id: string
  name: string
  costPrice: number
  defaultPrice: number
}

type BillItemState = {
  productId?: string | null
  newProductName?: string | null
  description: string
  quantity: number
  unitPrice: number
  sellPrice?: number | ''
  updateCostPrice?: boolean
  updateSellPrice?: boolean
  
  // UI helpers
  isNewProduct?: boolean
  costPriceChanged?: boolean
  sellPriceChanged?: boolean
}

export default function ProviderDetailsClient({ 
  providerId, 
  initialProducts = [] 
}: { 
  providerId: string
  initialProducts?: Product[] 
}) {
  const { t, locale } = useLanguage()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [products] = useState<Product[]>(initialProducts)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Add Bill Modal
  const [isAddingBill, setIsAddingBill] = useState(false)
  const [items, setItems] = useState<BillItemState[]>([{ description: '', quantity: 1, unitPrice: 0, sellPrice: '' }])

  // Confirmation Modals State
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmStep, setConfirmStep] = useState(0) // 0 means ready to submit
  const [pendingBillSubmit, setPendingBillSubmit] = useState(false)

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

  // Check items for needed confirmations
  function analyzeItemsForConfirmations(currentItems: BillItemState[]) {
    const skipNewProductConfirm = localStorage.getItem('skipNewProductConfirm') === 'true'
    
    return currentItems.map(item => {
      let isNewProduct = false
      let costPriceChanged = false
      let sellPriceChanged = false
      
      const matchedProduct = products.find(p => p.id === item.productId || p.name.toLowerCase() === item.description.toLowerCase().trim())
      
      if (!matchedProduct && item.description.trim()) {
        isNewProduct = !skipNewProductConfirm
      }
      
      if (matchedProduct) {
        if (item.unitPrice !== matchedProduct.costPrice) {
          costPriceChanged = true
        }
        if (item.sellPrice !== '' && item.sellPrice !== undefined && Number(item.sellPrice) !== matchedProduct.defaultPrice) {
          sellPriceChanged = true
        }
      }
      
      return {
        ...item,
        productId: matchedProduct?.id || null,
        newProductName: !matchedProduct ? item.description.trim() : null,
        isNewProduct,
        costPriceChanged,
        sellPriceChanged
      }
    })
  }

  function handleBillPreSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validItems = items.filter(i => i.description.trim() !== '')
    if (validItems.length === 0) {
      setError('Needs items')
      return
    }

    const analyzedItems = analyzeItemsForConfirmations(validItems)
    setItems(analyzedItems)
    
    // Check if any item needs confirmation
    const needsConfirm = analyzedItems.some(item => item.isNewProduct || item.costPriceChanged || item.sellPriceChanged)
    
    if (needsConfirm) {
      setConfirmStep(0)
      setShowConfirmModal(true)
    } else {
      submitBill(analyzedItems)
    }
  }
  
  // Handles the confirmation steps one by one for each item
  function handleNextConfirmStep() {
    const currentItem = items[confirmStep]
    
    // Move to next item that needs confirmation
    let nextStep = confirmStep + 1
    while (nextStep < items.length) {
      const nextItem = items[nextStep]
      if (nextItem.isNewProduct || nextItem.costPriceChanged || nextItem.sellPriceChanged) {
        break
      }
      nextStep++
    }
    
    if (nextStep < items.length) {
      setConfirmStep(nextStep)
    } else {
      setShowConfirmModal(false)
      submitBill(items)
    }
  }

  async function submitBill(finalItems: BillItemState[]) {
    setIsSubmitting(true)
    setError(null)
    try {
      const totalAmount = finalItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)

      const payload = finalItems.map(item => ({
        productId: item.productId,
        newProductName: item.newProductName,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        sellPrice: item.sellPrice !== '' ? Number(item.sellPrice) : null,
        updateCostPrice: item.updateCostPrice,
        updateSellPrice: item.updateSellPrice
      }))

      const response = await fetch(`/api/providers/${providerId}/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload, totalAmount }),
      })
      if (!response.ok) throw new Error('Failed')
      
      setIsAddingBill(false)
      setItems([{ description: '', quantity: 1, unitPrice: 0, sellPrice: '' }])
      await fetchProvider()
      
      // We'd ideally re-fetch products here too, but refreshing the page works for now
      window.location.reload() 
    } catch {
      setError('Unable to add bill.')
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
      const url = `/api/export/bills?providerId=${providerId}&type=${type}${billId ? '&billId=' + billId : ''}&lang=${locale}`
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

  // Current item needing confirmation
  const confirmItem = showConfirmModal ? items[confirmStep] : null
  const confirmProduct = confirmItem ? products.find(p => p.id === confirmItem.productId) : null

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
        <form onSubmit={handleBillPreSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">{t('providers.addBill')}</h2>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex flex-wrap items-end gap-3 p-4 border border-border rounded-xl bg-gray-50/50">
                <div className="flex-1 min-w-[200px] relative">
                  <label className="mb-1 block text-xs font-medium text-text-secondary">
                    Product Name (Search or New)
                  </label>
                  <input
                    type="text"
                    required
                    list="products-datalist"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm focus:border-black focus:outline-none"
                    value={item.description}
                    onChange={(e) => {
                      const newItems = [...items]
                      newItems[index].description = e.target.value
                      
                      // Auto-fill prices if matched exactly
                      const match = products.find(p => p.name.toLowerCase() === e.target.value.toLowerCase().trim())
                      if (match) {
                        newItems[index].productId = match.id
                        newItems[index].unitPrice = match.costPrice
                        newItems[index].sellPrice = match.defaultPrice
                      } else {
                        newItems[index].productId = null
                      }
                      
                      setItems(newItems)
                    }}
                    placeholder="Type product name..."
                  />
                  <datalist id="products-datalist">
                    {products.map(p => <option key={p.id} value={p.name} />)}
                  </datalist>
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
                  <label className="mb-1 block text-xs font-medium text-text-secondary">Cost Price</label>
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
                <div className="w-32">
                  <label className="mb-1 block text-xs font-medium text-text-secondary">New Sell Price</label>
                  <input
                    type="number"
                    step="0.01" min="0"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm focus:border-black focus:outline-none"
                    value={item.sellPrice}
                    onChange={(e) => {
                      const newItems = [...items]
                      newItems[index].sellPrice = e.target.value === '' ? '' : parseFloat(e.target.value)
                      setItems(newItems)
                    }}
                    placeholder="Optional"
                  />
                </div>
                <div className="flex flex-col justify-end pb-2">
                  <button type="button" onClick={() => {
                    const newItems = items.filter((_, i) => i !== index)
                    if (newItems.length === 0) newItems.push({ description: '', quantity: 1, unitPrice: 0, sellPrice: '' })
                    setItems(newItems)
                  }} className="text-status-cancelled hover:opacity-70">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="text-xs font-medium text-black hover:underline"
              onClick={() => setItems([...items, { description: '', quantity: 1, unitPrice: 0, sellPrice: '' }])}
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

      {/* Confirmation Modal */}
      {showConfirmModal && confirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold">Review: {confirmItem.description}</h3>
            
            {confirmItem.isNewProduct && (
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="mb-2 text-sm font-medium text-blue-900">
                  This product does not exist in your catalog. A new product will be created automatically.
                </p>
                <label className="flex items-center gap-2 text-sm text-blue-800">
                  <input type="checkbox" onChange={(e) => {
                    if (e.target.checked) localStorage.setItem('skipNewProductConfirm', 'true')
                    else localStorage.removeItem('skipNewProductConfirm')
                  }} />
                  Don't ask me again
                </label>
              </div>
            )}

            {confirmItem.costPriceChanged && confirmProduct && (
              <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 p-4">
                <p className="mb-2 text-sm font-medium text-amber-900">
                  Cost price changed from <span className="font-bold line-through">{confirmProduct.costPrice.toFixed(2)}</span> to <span className="font-bold">{confirmItem.unitPrice.toFixed(2)}</span>.
                </p>
                <label className="flex items-center gap-2 text-sm text-amber-800">
                  <input type="checkbox" checked={confirmItem.updateCostPrice || false} onChange={(e) => {
                    const newItems = [...items]
                    newItems[confirmStep].updateCostPrice = e.target.checked
                    setItems(newItems)
                  }} />
                  Update product cost price?
                </label>
              </div>
            )}

            {confirmItem.sellPriceChanged && confirmProduct && (
              <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="mb-2 text-sm font-medium text-emerald-900">
                  Sell price changed from <span className="font-bold line-through">{confirmProduct.defaultPrice.toFixed(2)}</span> to <span className="font-bold">{Number(confirmItem.sellPrice).toFixed(2)}</span>.
                </p>
                <label className="flex items-center gap-2 text-sm text-emerald-800">
                  <input type="checkbox" checked={confirmItem.updateSellPrice || false} onChange={(e) => {
                    const newItems = [...items]
                    newItems[confirmStep].updateSellPrice = e.target.checked
                    setItems(newItems)
                  }} />
                  Update product sell price?
                </label>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowConfirmModal(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-text-secondary hover:bg-black/5">
                Cancel
              </button>
              <button onClick={handleNextConfirmStep} className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/80">
                Continue
              </button>
            </div>
          </div>
        </div>
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
