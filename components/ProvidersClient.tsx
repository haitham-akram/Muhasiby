'use client'

import { useState } from 'react'
import { useLanguage } from '@/app/providers'
import { useProviders } from '@/hooks/useProviders'
import Link from 'next/link'
import type { LocalProvider } from '@/lib/local/types'

export default function ProvidersClient() {
  const { t } = useLanguage()
  const { providers, isLoading, addProvider } = useProviders()

  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAddProvider(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      await addProvider({ name, phone })
      setName('')
      setPhone('')
      setIsAdding(false)
    } catch {
      setError('Unable to create provider.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Compute totals from local data (bills and payments need to be loaded separately if needed)
  // For now, we'll show 0 since we don't have the bills/payments loaded in this view
  // The detailed view will have the full data

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
          providers.map((provider: LocalProvider) => (
            <Link
              href={`/providers/${provider.uuid}`}
              key={provider.uuid}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 transition hover:border-black"
            >
              <div>
                <h3 className="font-semibold">{provider.name}</h3>
                {provider.phone && <p className="text-xs text-text-secondary">{provider.phone}</p>}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-text-secondary">{t('providers.totalDebt')}</p>
                  <p className="font-semibold text-status-confirmed">0.00</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">{t('providers.billsCount')}</p>
                  <p className="font-medium">0</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}