'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useLanguage } from '@/app/providers'
import { useEffect, useState } from 'react'

import { TransactionSchema } from '@/lib/validations'
import ProductCombobox from '@/components/ProductCombobox'

type TransactionFormValues = z.infer<typeof TransactionSchema>

type TransactionFormProps = {
  onSubmit: (values: TransactionFormValues) => Promise<void>
  isSubmitting?: boolean
}

type Product = { id: string; name: string; defaultPrice: number }

export default function TransactionForm({ onSubmit, isSubmitting }: TransactionFormProps) {
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [newProductPrice, setNewProductPrice] = useState('')
  const [newProductCostPrice, setNewProductCostPrice] = useState('')
  const [isSavingProduct, setIsSavingProduct] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(TransactionSchema),
    defaultValues: {
      status: 'CONFIRMED',
      transactionItems: [{ name: '', quantity: 1, unitPrice: 0, totalPrice: 0 }],
      paymentSplits: [{ method: 'Cash', amount: 0 }],
      paymentMethod: 'Cash',
      buyerName: 'Walk-in',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'transactionItems',
  })

  const { fields: paymentFields, append: appendPayment, remove: removePayment } = useFieldArray({
    control,
    name: 'paymentSplits',
  })

  // Derived totals
  const watchItems = useWatch({ control, name: 'transactionItems' })
  const watchPayments = useWatch({ control, name: 'paymentSplits' })
  const status = useWatch({ control, name: 'status' })

  // Compute the running cart total
  const cartTotal = watchItems
    ? watchItems.reduce((acc, item) => acc + (item.totalPrice || 0), 0)
    : 0

  // Compute how much of the total is still unaccounted for in the splits
  const splitTotal = watchPayments
    ? watchPayments.reduce((acc, p) => acc + (p.amount || 0), 0)
    : 0
  const splitMismatch = watchPayments && watchPayments.length > 1 && Math.abs(splitTotal - cartTotal) > 0.001

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
  }, [])

  useEffect(() => {
    if (watchItems) {
      const itemsString = watchItems
        .filter((item) => item.name)
        .map((item) => `${item.quantity}x ${item.name}`)
        .join(', ')
      setValue('items', itemsString, { shouldValidate: true })

      const newTotal = watchItems.reduce((acc, item) => acc + (item.totalPrice || 0), 0)
      setValue('amount', newTotal, { shouldValidate: true })

      // Auto-update the first split amount only when there is exactly ONE split
      if (watchPayments && watchPayments.length === 1) {
        setValue('paymentSplits.0.amount', newTotal)
      }
    }
  }, [watchItems, setValue, watchPayments])

  useEffect(() => {
    if (watchPayments && watchPayments.length > 0) {
      const methods = Array.from(new Set(watchPayments.map(p => p.method))).join(' + ')
      setValue('paymentMethod', methods || 'Cash', { shouldValidate: true })
    }
  }, [watchPayments, setValue])

  async function handleFormSubmit(values: TransactionFormValues) {
    await onSubmit(values)
    reset({
      status: 'CONFIRMED',
      transactionItems: [{ name: '', quantity: 1, unitPrice: 0, totalPrice: 0 }],
      paymentSplits: [{ method: 'Cash', amount: 0 }],
      paymentMethod: 'Cash',
      buyerName: 'Walk-in',
      buyerPhone: '',
      items: '',
      amount: 0,
    })
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!newProductName.trim()) return
    const parsedPrice = parseFloat(newProductPrice)
    const defaultPrice = isNaN(parsedPrice) || parsedPrice < 0 ? 0 : parsedPrice
    const parsedCostPrice = parseFloat(newProductCostPrice)
    const costPrice = isNaN(parsedCostPrice) || parsedCostPrice < 0 ? 0 : parsedCostPrice
    setIsSavingProduct(true)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProductName.trim(), defaultPrice, costPrice }),
      })
      if (res.ok) {
        const { product } = await res.json()
        setProducts((prev) => [...prev, product])
        setIsAddingProduct(false)
        setNewProductName('')
        setNewProductPrice('')
        setNewProductCostPrice('')
        
        // Auto-add it to the cart
        append({
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: product.defaultPrice,
          totalPrice: product.defaultPrice * 1,
        })
      } else {
        const errorData = await res.json()
        console.error('Failed to create product:', errorData)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSavingProduct(false)
    }
  }

  return (
    <div className="relative">
      <form
        className="space-y-4 rounded-2xl md:border md:border-border md:bg-card md:p-6 md:shadow-sm"
        onSubmit={handleSubmit(handleFormSubmit)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            {t('transactionForm.buyerName')}
            <input
              className="rounded-xl border border-border bg-background px-3 py-2"
              {...register('buyerName')}
              placeholder={t("transactionForm.buyerNamePlaceholder")}
            />
            {errors.buyerName ? <span className="text-xs text-status-cancelled">{errors.buyerName.message}</span> : null}
          </label>
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-medium">{t('transactionForm.paymentMethod')}</span>
            {paymentFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <select
                  className="rounded-xl border border-border bg-background px-3 py-2 flex-1"
                  {...register(`paymentSplits.${index}.method` as const)}
                >
                  {(['Cash', 'Bank Transfer', 'Mahfaza', 'Jawwal Pay'] as const).map((opt) => (
                    <option key={opt} value={opt}>
                      {t(`transactionForm.paymentOptions.${opt}`)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  className="rounded-xl border border-border bg-background px-3 py-2 w-24"
                  placeholder="0.00"
                  {...register(`paymentSplits.${index}.amount` as const, { valueAsNumber: true })}
                />
                {paymentFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      removePayment(index)
                      // After removing, give the remaining amount to the first split
                      setTimeout(() => {
                        setValue('paymentSplits.0.amount', cartTotal)
                      }, 0)
                    }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-status-cancelled text-status-cancelled hover:bg-status-cancelled hover:text-white transition-colors text-base font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {/* Split mismatch warning */}
            {splitMismatch && (
              <p className="text-xs text-status-cancelled">{t('transactionForm.splitPaymentWarning')}</p>
            )}
            <button
              type="button"
              onClick={() => {
                // Distribute the remaining unallocated amount to the new split
                const allocated = watchPayments?.reduce((acc, p) => acc + (p.amount || 0), 0) ?? 0
                const remainder = Math.max(0, cartTotal - allocated)
                appendPayment({ method: 'Cash', amount: remainder })
              }}
              className="self-start rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-border transition-colors mt-1"
            >
              {t('transactionForm.splitPaymentBtn')}
            </button>
            <input type="hidden" {...register('paymentMethod')} />
            {errors.paymentMethod ? (
              <span className="text-xs text-status-cancelled">{errors.paymentMethod.message}</span>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-border p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium">{t('transactionForm.itemsPurchased')}</h3>
            <button
              type="button"
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-border transition-colors"
              onClick={() => setIsAddingProduct(true)}
            >
              {t('transactionForm.newProductBtn')}
            </button>
          </div>
          <div className="space-y-3">
            {fields.map((field, index) => {
              const currentItem = watchItems?.[index]
              const rowTotal = ((currentItem?.quantity || 0) * (currentItem?.unitPrice || 0))
              return (
              <div key={field.id} className="flex flex-wrap items-start gap-3 sm:flex-nowrap">
                <div className="w-full sm:flex-1">
                  <ProductCombobox
                    products={products}
                    placeholder={t('transactionForm.productName')}
                    value={currentItem?.name || ''}
                    error={!!errors.transactionItems?.[index]?.name}
                    onChange={(val, product) => {
                      setValue(`transactionItems.${index}.name`, val, { shouldValidate: true })
                      if (product) {
                        setValue(`transactionItems.${index}.productId`, product.id, { shouldDirty: true })
                        setValue(`transactionItems.${index}.unitPrice`, product.defaultPrice, { shouldDirty: true })
                        setValue(`transactionItems.${index}.totalPrice`, product.defaultPrice * (currentItem?.quantity || 1), { shouldDirty: true })
                      }
                    }}
                  />
                  {errors.transactionItems?.[index]?.name && (
                    <span className="text-xs text-status-cancelled">{errors.transactionItems[index]?.name?.message}</span>
                  )}
                </div>
                <div className="w-20 shrink-0">
                  <input
                    type="number"
                    min="1"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    placeholder={t('transactionForm.qty')}
                    {...register(`transactionItems.${index}.quantity` as const, {
                      valueAsNumber: true,
                      onChange: (e) => {
                        const qty = parseInt(e.target.value, 10) || 0
                        const price = currentItem?.unitPrice || 0
                        setValue(`transactionItems.${index}.totalPrice`, qty * price, { shouldDirty: true })
                      }
                    })}
                  />
                </div>
                <div className="w-24 shrink-0">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    placeholder={t('transactionForm.price')}
                    {...register(`transactionItems.${index}.unitPrice` as const, {
                      valueAsNumber: true,
                      onChange: (e) => {
                        const price = parseFloat(e.target.value) || 0
                        const qty = currentItem?.quantity || 0
                        setValue(`transactionItems.${index}.totalPrice`, qty * price, { shouldDirty: true })
                      }
                    })}
                  />
                </div>
                <div className="flex w-20 shrink-0 items-center justify-between py-2">
                  <span className="text-sm font-medium">{rowTotal.toFixed(2)}</span>
                  <button
                    type="button"
                    className="text-status-cancelled"
                    onClick={() => remove(index)}
                  >
                    ×
                  </button>
                </div>
              </div>
              )
            })}
          </div>

          <button
            type="button"
            className="mt-4 rounded-lg bg-border px-3 py-1.5 text-sm font-medium"
            onClick={() => append({ name: '', quantity: 1, unitPrice: 0, totalPrice: 0 })}
          >
            {t('transactionForm.addRowBtn')}
          </button>
          
          <input type="hidden" {...register('items')} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm">
            {t('transactionForm.amount')}
            <input
              type="number"
              step="0.01"
              readOnly
              className="rounded-xl border border-border bg-background px-3 py-2 cursor-not-allowed opacity-80"
              {...register('amount', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.amount ? <span className="text-xs text-status-cancelled">{errors.amount.message}</span> : null}
          </label>
          <label className="flex flex-col gap-2 text-sm">
            {t('transactionForm.status')}
            <select className="rounded-xl border border-border bg-background px-3 py-2" {...register('status')}>
              <option value="CONFIRMED">{t("transactionForm.statusConfirmed")}</option>
              <option value="PENDING">{t("transactionForm.statusPending")}</option>
              <option value="CANCELLED">{t("transactionForm.statusCancelled")}</option>
            </select>
          </label>
          {status === 'PENDING' ? (
            <label className="flex flex-col gap-2 text-sm">
              {t('transactionForm.phoneNumber')}
              <input
                className="rounded-xl border border-border bg-background px-3 py-2"
                {...register('buyerPhone')}
                placeholder="07xxxxxxxx"
              />
              {errors.buyerPhone ? (
                <span className="text-xs text-status-cancelled">{errors.buyerPhone.message}</span>
              ) : null}
            </label>
          ) : null}
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={isSubmitting}
        >
          {isSubmitting ? t("transactionForm.savingBtn") : t("transactionForm.addBtn")}
        </button>
      </form>

      {isAddingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">{t('transactionForm.newProductTitle')}</h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <label className="flex flex-col gap-2 text-sm">
                {t('transactionForm.nameLabel')}
                <input
                  autoFocus
                  required
                  className="rounded-xl border border-border bg-background px-3 py-2"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                {t('transactionForm.defaultPriceLabel')}
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="rounded-xl border border-border bg-background px-3 py-2"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  placeholder="0.00"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                {t('inventory.costPrice')}
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="rounded-xl border border-border bg-background px-3 py-2"
                  value={newProductCostPrice}
                  onChange={(e) => setNewProductCostPrice(e.target.value)}
                  placeholder="0.00"
                />
              </label>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-xl px-4 py-2 text-sm font-medium hover:bg-border"
                  onClick={() => setIsAddingProduct(false)}
                >
                  {t('transactionForm.cancelBtn')}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  disabled={isSavingProduct}
                >
                  {t('transactionForm.saveBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

