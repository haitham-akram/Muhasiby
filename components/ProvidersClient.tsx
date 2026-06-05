'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/app/providers'
import type { Provider } from '@/lib/types'
import Link from 'next/link'

export default function ProvidersClient() {
  const { t } = useLanguage()
  const [providers, setProviders] = useState<Provider[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    void fetchProviders()
  }, [])

  async function fetchProviders() {
    try {
      const response = await fetch('/api/providers')
      if (!response.ok) throw new Error('Failed')
      const data = await response.json()
      setProviders(data.providers)
    } catch {
      setError(t('providers.noProviders'))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddProvider(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      })
      if (!response.ok) throw new Error('Failed')
      setName('')
      setPhone('')
      setIsAdding(false)
      await fetchProviders()
    } catch {
      setError('Unable to create provider.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{t('providers.title')}</h1>
          <p className="text-sm text-text-secondary">{t('providers.subtitle')}</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/80"
        >
          {t('providers.addBtn')}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-status-cancelled bg-card px-4 py-3 text-sm text-status-cancelled">
          {error}
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleAddProvider} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">{t('providers.create')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">{t('providers.name')}</label>
              <input
                type="text"
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm focus:border-black focus:outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">{t('providers.phone')}</label>
              <input
                type="text"
                className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm focus:border-black focus:outline-none"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-text-secondary hover:bg-black/5"
            >
              {t('providers.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSubmitting ? t('providers.creating') : t('providers.create')}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-sm text-text-secondary">Loading...</p>
        ) : providers.length === 0 ? (
          <p className="text-sm text-text-secondary">{t('providers.noProviders')}</p>
        ) : (
          providers.map((provider) => (
            <Link
              href={`/providers/${provider.id}`}
              key={provider.id}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 transition hover:border-black"
            >
              <div>
                <h3 className="font-semibold">{provider.name}</h3>
                {provider.phone && <p className="text-xs text-text-secondary">{provider.phone}</p>}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-text-secondary">{t('providers.totalDebt')}</p>
                  <p className={`font-semibold ${provider.totalDebt > 0 ? 'text-status-cancelled' : 'text-status-confirmed'}`}>
                    {provider.totalDebt.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">{t('providers.billsCount')}</p>
                  <p className="font-medium">{provider.billsCount}</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
