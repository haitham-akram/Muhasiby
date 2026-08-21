'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLanguage } from '@/app/providers'
import { useProducts } from '@/hooks/useProducts'
import { useProviders } from '@/hooks/useProviders'

type Category = {
  id: string
  name: string
}

type LocalProduct = {
  uuid: string
  name: string
  defaultPrice: number
  costPrice: number
  stock: number
  categoryId?: string
  providerId?: string
  syncStatus: 'pending' | 'synced' | 'failed'
}

type LocalProvider = {
  uuid: string
  name: string
  phone?: string
  syncStatus: 'pending' | 'synced' | 'failed'
}

export default function InventoryClient() {
  const { t } = useLanguage()
  const { products, isLoading: productsLoading, addProduct } = useProducts()
  const { providers, isLoading: providersLoading } = useProviders()
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [providerId, setProviderId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  // Load categories from server (they don't have offline support yet)
  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories ?? data)
      }
    } catch {
      // Ignore - will use empty array
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!name) return

    setIsSubmitting(true)
    try {
      // Use local-first repository
      await addProduct({
        name,
        defaultPrice: Number(price) || 0,
        costPrice: Number(costPrice) || 0,
        stock: 0,
        categoryId: categoryId || undefined,
        providerId: providerId || undefined,
      })
      
      setIsAdding(false)
      setName('')
      setPrice('')
      setCostPrice('')
      setProviderId('')
      setCategoryId('')
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCategoryName) return

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      })
      if (res.ok) {
        const { category } = await res.json()
        setCategories((prev) => [...prev, category].sort((a, b) => a.name.localeCompare(b.name)))
        setCategoryId(category.id)
        setIsAddingCategory(false)
        setNewCategoryName('')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Grouping - using local product/provider data
  const groupedProducts = useMemo(() => {
    return products.reduce((acc, product) => {
      const provider = providers.find(p => p.uuid === product.providerId)
      const category = categories.find(c => c.id === product.categoryId)
      
      const providerName = provider?.name || t('inventory.unassignedProvider') || 'Unassigned Provider'
      const categoryName = category?.name || t('inventory.unassignedCategory') || 'Unassigned Category'
      
      if (!acc[providerName]) acc[providerName] = {}
      if (!acc[providerName][categoryName]) acc[providerName][categoryName] = []
      
      acc[providerName][categoryName].push({
        ...product,
        provider,
        category,
      })
      return acc
    }, {} as Record<string, Record<string, (LocalProduct & { provider?: LocalProvider | null; category?: Category | null })[]>>)
  }, [products, providers, categories, t])

  const isLoading = productsLoading || providersLoading || categoriesLoading

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
        <div className="mb-6 rounded-xl border border-border bg-background p-4">
          <form onSubmit={handleAddProduct}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-2 text-sm sm:col-span-2 lg:col-span-2">
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
              <label className="flex flex-col gap-2 text-sm">
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

              <label className="flex flex-col gap-2 text-sm sm:col-span-2 lg:col-span-2">
                {t('inventory.provider')}
                <select
                  className="rounded-xl border border-border px-3 py-2 bg-white"
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                >
                  <option value="">{t('inventory.selectProvider') || 'Select Provider'}</option>
                  {providers.map((p: LocalProvider) => (
                    <option key={p.uuid} value={p.uuid}>{p.name}</option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col gap-2 text-sm sm:col-span-2 lg:col-span-2">
                <label className="flex flex-col gap-2">
                  {t('inventory.category')}
                  <div className="flex gap-2">
                    <select
                      className="rounded-xl border border-border px-3 py-2 bg-white flex-1"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                    >
                      <option value="">{t('inventory.selectCategory') || 'Select Category'}</option>
                      {categories.map((c: Category) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(!isAddingCategory)}
                      className="rounded-xl border border-border px-3 py-2 text-xs font-medium"
                    >
                      {isAddingCategory ? 'x' : '+'}
                    </button>
                  </div>
                </label>
                
                {isAddingCategory && (
                  <div className="flex gap-2 mt-2">
                    <input
                      className="rounded-xl border border-border px-3 py-1 flex-1 text-sm"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder={t('inventory.newCategoryPlaceholder') || 'New Category Name'}
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="rounded-xl bg-gray-200 px-3 py-1 text-xs font-medium"
                    >
                      {t('inventory.createCategory') || 'Create'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {isSubmitting ? t('inventory.savingBtn') : t('inventory.saveBtn')}
              </button>
            </div>
            </form>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-text-secondary">Loading...</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-text-secondary">{t('inventory.noProducts')}</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedProducts).map(([providerName, categoriesMap]) => (
            <div key={providerName} className="rounded-xl border border-border overflow-hidden">
              <div className="bg-gray-50 dark:bg-black/20 px-4 py-3 border-b border-border">
                <h3 className="font-bold text-gray-900 dark:text-gray-100">{providerName}</h3>
              </div>
              
              <div className="divide-y divide-border">
                {Object.entries(categoriesMap).map(([categoryName, categoryProducts]) => (
                  <div key={categoryName} className="px-4 py-3">
                    <h4 className="text-sm font-semibold text-text-secondary mb-2">
                      {categoryName}
                    </h4>
                    
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {categoryProducts.map((product) => {
                        let stockBadge
                        if (product.stock <= 0) {
                          stockBadge = <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">{t('stockOut')}</span>
                        } else if (product.stock <= 5) {
                          stockBadge = <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">{t('stockLow').replace('{stock}', product.stock.toString())}</span>
                        } else {
                          stockBadge = <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">{t('stockOk').replace('{stock}', product.stock.toString())}</span>
                        }
                        return (
                          <div key={product.uuid} className="rounded-lg border border-border bg-white dark:bg-card p-4 space-y-2">
                            <div className="flex justify-between items-start">
                              <h5 className="font-medium text-gray-900 dark:text-gray-100">{product.name}</h5>
                              <span className="font-medium text-emerald-600">{product.defaultPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span>{t('inventory.costPrice')}: {product.costPrice?.toFixed(2) || '0.00'}</span>
                              <span>{stockBadge}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white dark:bg-card text-xs text-gray-400 border-b border-border">
                          <tr>
                            <th className="py-2 pr-4 font-normal">{t('inventory.productName')}</th>
                            <th className="py-2 px-4 font-normal">{t('inventory.costPrice')}</th>
                            <th className="py-2 px-4 font-normal">{t('inventory.defaultPrice')}</th>
                            <th className="py-2 pl-4 font-normal">Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-border">
                          {categoryProducts.map((product) => {
                            let stockBadge
                            if (product.stock <= 0) {
                              stockBadge = <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">{t('stockOut')}</span>
                            } else if (product.stock <= 5) {
                              stockBadge = <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">{t('stockLow').replace('{stock}', product.stock.toString())}</span>
                            } else {
                              stockBadge = <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">{t('stockOk').replace('{stock}', product.stock.toString())}</span>
                            }
                            return (
                              <tr key={product.uuid} className="hover:bg-gray-50 dark:hover:bg-black/20 transition-colors">
                                <td className="py-2 pr-4 font-medium text-gray-900 dark:text-gray-100">{product.name}</td>
                                <td className="py-2 px-4 text-gray-600 dark:text-gray-400">{product.costPrice?.toFixed(2) || '0.00'}</td>
                                <td className="py-2 px-4 font-medium text-emerald-600">{product.defaultPrice.toFixed(2)}</td>
                                <td className="py-2 pl-4">{stockBadge}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}