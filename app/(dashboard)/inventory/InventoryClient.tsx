'use client'

import { useState } from 'react'
import { useLanguage } from '@/app/providers'

type Product = {
  id: string
  name: string
  defaultPrice: number
  costPrice: number
}

export default function InventoryClient({ initialProducts }: { initialProducts: Product[] }) {
  const { t } = useLanguage()
  const [products, setProducts] = useState(initialProducts)
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, defaultPrice: Number(price) || 0, costPrice: Number(costPrice) || 0 }),
      })
      if (res.ok) {
        const { product } = await res.json()
        setProducts((prev) => [...prev, product].sort((a, b) => a.name.localeCompare(b.name)))
        setIsAdding(false)
        setName('')
        setPrice('')
        setCostPrice('')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold">{t('inventory.productsDirectory')}</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
        >
          {isAdding ? t('inventory.cancelBtn') : t('inventory.addBtn')}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="mb-6 rounded-xl border border-border bg-background p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm md:col-span-2">
              {t('inventory.productName')}
              <input
                autoFocus
                required
                className="rounded-xl border border-border px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('inventory.productNamePlaceholder')}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm md:col-span-1">
              {t('inventory.costPrice')}
              <input
                type="number"
                step="0.01"
                className="rounded-xl border border-border px-3 py-2"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0.00"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              {t('inventory.defaultPrice')}
              <input
                type="number"
                step="0.01"
                className="rounded-xl border border-border px-3 py-2"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSubmitting ? t('inventory.savingBtn') : t('inventory.saveBtn')}
            </button>
          </div>
        </form>
      )}

      {products.length === 0 ? (
        <p className="text-sm text-text-secondary">{t('inventory.noProducts')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-background text-xs uppercase text-text-secondary">
              <tr>
                <th className="px-4 py-3">{t('inventory.productName')}</th>
                <th className="px-4 py-3">{t('inventory.costPrice')}</th>
                <th className="px-4 py-3">{t('inventory.defaultPrice')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3">{product.costPrice?.toFixed(2) || '0.00'}</td>
                  <td className="px-4 py-3">{product.defaultPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
