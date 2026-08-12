'use client'

import { useEffect, useState, useMemo } from 'react'
import { useLanguage } from '@/app/providers'
import { useProducts } from '@/hooks/useProducts'
import { useBills } from '@/hooks/useBills'
import { useProviderPayments } from '@/hooks/useProviderPayments'
import { useProviders } from '@/hooks/useProviders'
import type { LocalProduct, LocalBillItem } from '@/lib/local/types'
import Link from 'next/link'

type BillItemState = {
  productUuid?: string | null
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
  providerId 
}: { 
  providerId: string
}) {
  const { t, locale } = useLanguage()
  const { providers, isLoading: providersLoading, mutateProviders } = useProviders()
  const { products, isLoading: productsLoading, mutateProducts } = useProducts()
  const { bills, isLoading: billsLoading, mutateBills, addBill } = useBills(providerId)
  const { payments, isLoading: paymentsLoading, mutatePayments, addPayment } = useProviderPayments(providerId)

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Add Bill Modal
  const [isAddingBill, setIsAddingBill] = useState(false)
  const [items, setItems] = useState<BillItemState[]>([{ description: '', quantity: 1, unitPrice: 0, sellPrice: '' }])

  // Confirmation Modals State
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmStep, setConfirmStep] = useState(0)

  // Add Payment Modal
  const [isAddingPayment, setIsAddingPayment] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('')

  // Find the current provider from local data
  const provider = useMemo(() => 
    providers.find(p => p.uuid === providerId) || null,
    [providers, providerId]
  )

  // Load products for autocomplete when provider page loads
  useEffect(() => {
    mutateProducts()
  }, [mutateProducts])

  // Check items for needed confirmations
  function analyzeItemsForConfirmations(currentItems: BillItemState[], availableProducts: LocalProduct[]) {
    const skipNewProductConfirm = localStorage.getItem('skipNewProductConfirm') === 'true'
    
    return currentItems.map(item => {
      let isNewProduct = false
      let costPriceChanged = false
      let sellPriceChanged = false
      
      const matchedProduct = availableProducts.find(p => 
        p.uuid === item.productUuid || p.name.toLowerCase() === item.description.toLowerCase().trim()
      )
      
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
        productUuid: matchedProduct?.uuid || null,
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

    const analyzedItems = analyzeItemsForConfirmations(validItems, products)
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

      const billItems = finalItems.map(item => ({
        productUuid: item.productUuid ?? undefined,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        sellPrice: item.sellPrice !== '' ? Number(item.sellPrice) : undefined,
        total: item.quantity * item.unitPrice,
      }))

      // Get provider server ID if available
      const providerData = provider
      const providerServerId = providerData?.serverId

      await addBill({
        providerUuid: providerId,
        providerServerId,
        totalAmount,
        status: 'UNPAID',
        date: new Date().toISOString(),
        items: billItems,
      })

      setIsAddingBill(false)
      setItems([{ description: '', quantity: 1, unitPrice: 0, sellPrice: '' }])
      await mutateBills()
      await mutateProviders() // Refresh provider totals
      
      // If we created new products locally, refresh products
      const newProducts = finalItems.filter(item => item.isNewProduct && item.newProductName)
      if (newProducts.length > 0) {
        await mutateProducts()
      }
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
      const providerData = provider
      const providerServerId = providerData?.serverId
      
      await addPayment({
        providerUuid: providerId,
        providerServerId,
        amount: Number(paymentAmount),
        date: new Date().toISOString(),
      })
      
      setIsAddingPayment(false)
      setPaymentAmount('')
      await mutatePayments()
      await mutateProviders() // Refresh provider totals
    } catch {
      setError('Unable to add payment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleExport(type: 'excel' | 'pdf', billId?: string) {
    setExporting(true)
    try {
      // Use local provider UUID for export
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

  // Compute totals from local data
  const totalBills = useMemo(() => bills.reduce((sum, b) => sum + b.totalAmount, 0), [bills])
  const totalPayments = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments])
  const totalDebt = totalBills - totalPayments

  const isLoading = providersLoading || productsLoading || billsLoading || paymentsLoading

  if (isLoading) {
    return <div className="p-10 text-center">Loading...</div>
  }

  if (!provider) {
    return <div className="p-10 text-center">Provider not found</div>
  }

  // Current item needing confirmation
  const confirmItem = showConfirmModal ? items[confirmStep] : null
  const confirmProduct = confirmItem ? products.find(p => p.uuid === confirmItem.productUuid) : null

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <Link href="/providers" className="text-sm text-text-secondary hover:underline">
        &larr; {t('providers.title')}
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{provider.name}</h1>
          {provider.phone && <p className="text-sm text-text-secondary">{provider.phone}</p>}
          <p className={`mt-2 text-lg font-bold ${totalDebt > 0 ? 'text-status-cancelled' : 'text-status-confirmed'}`}>
            {t('providers.totalDebt')}: {totalDebt.toFixed(2)}
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
              <div key={index} className="grid gap-3 sm:grid-cols-[1fr_60px_80px_80px] p-4 border border-border rounded-xl bg-gray-50/50">
                <div className="relative sm:col-span-1">
                  <label className="mb-1 block text-xs font-medium text-text-secondary">
                    {t('productNameLabel')}
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
                        newItems[index].productUuid = match.uuid
                        newItems[index].unitPrice = match.costPrice
                        newItems[index].sellPrice = match.defaultPrice
                      } else {
                        newItems[index].productUuid = null
                      }
                      
                      setItems(newItems)
                    }}
                    placeholder="Type product name..."
                  />
                  <datalist id="products-datalist">
                    {products.map(p => <option key={p.uuid} value={p.name} />)}
                  </datalist>
                </div>
                <div className="sm:col-span-1">
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
                <div className="sm:col-span-1">
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
                <div className="sm:col-span-1">
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
                <div className="sm:col-span-4 flex justify-end">
                  <button type="button" onClick={() => {
                    const newItems = items.filter((_, i) => i !== index)
                    if (newItems.length === 0) newItems.push({ description: '', quantity: 1, unitPrice: 0, sellPrice: '' })
                    setItems(newItems)
                  }} className="text-status-cancelled hover:opacity-70 p-2">
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
                  {t('confirmNewProduct')}
                </p>
                <label className="flex items-center gap-2 text-sm text-blue-800">
                  <input type="checkbox" onChange={(e) => {
                    if (e.target.checked) localStorage.setItem('skipNewProductConfirm', 'true')
                    else localStorage.removeItem('skipNewProductConfirm')
                  }} />
                  {t('dontAskAgain')}
                </label>
              </div>
            )}

            {confirmItem.costPriceChanged && confirmProduct && (
              <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 p-4">
                <p className="mb-2 text-sm font-medium text-amber-900">
                  {t('costPriceChanged', { oldPrice: confirmProduct.costPrice.toFixed(2), newPrice: confirmItem.unitPrice.toFixed(2) })}
                </p>
                <label className="flex items-center gap-2 text-sm text-amber-800">
                  <input type="checkbox" checked={confirmItem.updateCostPrice || false} onChange={(e) => {
                    const newItems = [...items]
                    newItems[confirmStep].updateCostPrice = e.target.checked
                    setItems(newItems)
                  }} />
                  {t('updateCostPrice')}
                </label>
              </div>
            )}

            {confirmItem.sellPriceChanged && confirmProduct && (
              <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="mb-2 text-sm font-medium text-emerald-900">
                  {t('sellPriceChanged', { oldPrice: confirmProduct.defaultPrice.toFixed(2), newPrice: Number(confirmItem.sellPrice).toFixed(2) })}
                </p>
                <label className="flex items-center gap-2 text-sm text-emerald-800">
                  <input type="checkbox" checked={confirmItem.updateSellPrice || false} onChange={(e) => {
                    const newItems = [...items]
                    newItems[confirmStep].updateSellPrice = e.target.checked
                    setItems(newItems)
                  }} />
                  {t('updateSellPrice')}
                </label>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowConfirmModal(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-text-secondary hover:bg-black/5">
                {t('cancel')}
              </button>
              <button onClick={handleNextConfirmStep} className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/80">
                {t('continue')}
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
            {bills.length ? bills.map(bill => (
              <div key={bill.uuid} className="rounded-xl border border-border bg-background p-4 flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div>
                    <p className="font-semibold">{t('providers.totalAmount')}: {bill.totalAmount.toFixed(2)}</p>
                    <p className="text-xs text-text-secondary">{new Date(bill.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleExport('pdf', bill.uuid)}
                      className="text-xs font-medium text-text-secondary border border-border px-2 py-1 rounded hover:bg-black/5 whitespace-nowrap"
                    >
                      {t('providers.exportPdf')}
                    </button>
                    <button
                      onClick={() => handleExport('excel', bill.uuid)}
                      className="text-xs font-medium text-text-secondary border border-border px-2 py-1 rounded hover:bg-black/5 whitespace-nowrap"
                    >
                      {t('providers.exportExcel')}
                    </button>
                  </div>
                </div>
                <div className="space-y-1 mt-2">
                  {bill.items.map((billItem: LocalBillItem, idx: number) => (
                    <div key={billItem.uuid ?? idx} className="text-sm text-text-secondary flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span>{billItem.description} x {billItem.quantity}</span>
                      <span>{billItem.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )) : <p className="text-sm text-text-secondary">{t('providers.noBills')}</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">{t('providers.payments')}</h2>
          <div className="space-y-4">
            {payments.length ? payments.map(payment => (
              <div key={payment.uuid} className="rounded-xl border border-border bg-background p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
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