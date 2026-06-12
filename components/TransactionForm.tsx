'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { useLanguage } from '@/app/providers'
import { useEffect, useState } from 'react'

import { TransactionSchema } from '@/lib/validations'

type TransactionFormValues = z.infer<typeof TransactionSchema>

type TransactionFormProps = {
  onSubmit: (values: TransactionFormValues) => Promise<void>
  isSubmitting?: boolean
}

type Product = { id: string; name: string; defaultPrice: number }

export default function TransactionForm({ onSubmit, isSubmitting = false }: TransactionFormProps) {
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [newProductPrice, setNewProductPrice] = useState('')
  const [isSavingProduct, setIsSavingProduct] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(TransactionSchema),
    defaultValues: {
      status: 'PENDING',
      transactionItems: [],
      items: '',
      amount: 0,
      paymentMethod: 'Cash',
      buyerName: 'Walk-in',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'transactionItems',
  })

  const status = watch('status')
  const watchItems = watch('transactionItems')

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
  }, [])

  // Auto-calculate totals
  useEffect(() => {
    if (watchItems && watchItems.length > 0) {
      let total = 0
      const itemsText = watchItems
        .map((item, index) => {
          const itemTotal = (item.quantity || 0) * (item.unitPrice || 0)
          if (item.totalPrice !== itemTotal) {
            setValue(`transactionItems.${index}.totalPrice`, itemTotal, { shouldValidate: true })
          }
          total += itemTotal
          return `${item.name} x ${item.quantity} = ${itemTotal}`
        })
        .join('\n')
      
      setValue('amount', total)
      setValue('items', itemsText)
    } else {
      setValue('amount', 0)
      setValue('items', '')
    }
  }, [watchItems, setValue])

  async function handleFormSubmit(values: TransactionFormValues) {
    await onSubmit(values)
    reset({ status: 'PENDING', transactionItems: [], items: '', amount: 0, paymentMethod: 'Cash', buyerName: 'Walk-in' })
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!newProductName) return
    setIsSavingProduct(true)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProductName, defaultPrice: Number(newProductPrice) || 0 }),
      })
      if (res.ok) {
        const { product } = await res.json()
        setProducts((prev) => [...prev, product])
        setIsAddingProduct(false)
        setNewProductName('')
        setNewProductPrice('')
        
        // Auto-add it to the cart
        append({
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: product.defaultPrice,
          totalPrice: product.defaultPrice,
        })
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
              className="rounded-xl border border-border px-3 py-2"
              {...register('buyerName')}
              placeholder={t("transactionForm.buyerNamePlaceholder")}
            />
            {errors.buyerName ? <span className="text-xs text-status-cancelled">{errors.buyerName.message}</span> : null}
          </label>
          <label className="flex flex-col gap-2 text-sm">
            {t('transactionForm.paymentMethod')}
            <input
              className="rounded-xl border border-border px-3 py-2"
              {...register('paymentMethod')}
              placeholder={t('transactionForm.paymentMethodPlaceholder')}
            />
            {errors.paymentMethod ? (
              <span className="text-xs text-status-cancelled">{errors.paymentMethod.message}</span>
            ) : null}
          </label>
        </div>

        <div className="rounded-xl border border-border p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium">{t('transactionForm.itemsPurchased')}</h3>
            <button
              type="button"
              className="text-xs text-blue-600 hover:underline"
              onClick={() => setIsAddingProduct(true)}
            >
              {t('transactionForm.newProductBtn')}
            </button>
          </div>
          
          <datalist id="products-list">
            {products.map((p) => (
              <option key={p.id} value={p.name} />
            ))}
          </datalist>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-wrap items-start gap-3 sm:flex-nowrap">
                <div className="w-full sm:flex-1">
                  <input
                    list="products-list"
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                    placeholder={t('transactionForm.productName')}
                    {...register(`transactionItems.${index}.name` as const)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setValue(`transactionItems.${index}.name`, val);
                      const product = products.find(p => p.name === val);
                      if (product) {
                        setValue(`transactionItems.${index}.productId`, product.id);
                        setValue(`transactionItems.${index}.unitPrice`, product.defaultPrice);
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
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                    placeholder={t('transactionForm.qty')}
                    {...register(`transactionItems.${index}.quantity` as const, { valueAsNumber: true })}
                  />
                </div>
                <div className="w-24 shrink-0">
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                    placeholder={t('transactionForm.price')}
                    {...register(`transactionItems.${index}.unitPrice` as const, { valueAsNumber: true })}
                  />
                </div>
                <div className="flex w-20 shrink-0 items-center justify-between py-2">
                  <span className="text-sm font-medium">{(watchItems?.[index]?.totalPrice || 0).toFixed(2)}</span>
                  <button
                    type="button"
                    className="text-status-cancelled"
                    onClick={() => remove(index)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
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
              className="rounded-xl border border-border px-3 py-2"
              {...register('amount', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.amount ? <span className="text-xs text-status-cancelled">{errors.amount.message}</span> : null}
          </label>
          <label className="flex flex-col gap-2 text-sm">
            {t('transactionForm.status')}
            <select className="rounded-xl border border-border px-3 py-2" {...register('status')}>
              <option value="CONFIRMED">{t("transactionForm.statusConfirmed")}</option>
              <option value="PENDING">{t("transactionForm.statusPending")}</option>
              <option value="CANCELLED">{t("transactionForm.statusCancelled")}</option>
            </select>
          </label>
          {status === 'PENDING' ? (
            <label className="flex flex-col gap-2 text-sm">
              {t('transactionForm.phoneNumber')}
              <input
                className="rounded-xl border border-border px-3 py-2"
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
                  className="rounded-xl border border-border px-3 py-2"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                {t('transactionForm.defaultPriceLabel')}
                <input
                  type="number"
                  step="0.01"
                  className="rounded-xl border border-border px-3 py-2"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
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

