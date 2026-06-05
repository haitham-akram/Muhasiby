'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { useLanguage } from '@/app/providers'

type Cashier = {
  id: string
  name: string
  email: string
  createdAt: string
}

export default function CashiersClient() {
  const { t } = useLanguage();
  const [cashiers, setCashiers] = useState<Cashier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchCashiers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/cashiers')
      if (!res.ok) throw new Error('Failed to load cashiers')
      const data = await res.json()
      setCashiers(data.cashiers)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unknown error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCashiers()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/cashiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Failed to create cashier')
      }
      setName('')
      setEmail('')
      setPassword('')
      await fetchCashiers() // Refresh the list
    } catch (err: unknown) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t("cashiers.confirmDelete"))) return
    try {
      const res = await fetch(`/api/cashiers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete cashier')
      setCashiers((prev) => prev.filter((c) => c.id !== id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error')
    }
  }

  return (
    <div className="flex flex-col gap-8 md:flex-row">
      {/* Create Form */}
      <div className="flex-1 rounded-2xl border border-border bg-card p-6 shadow-sm h-fit">
        <h2 className="mb-4 text-xl font-semibold">{t("cashiers.addNew")}</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          {error && <div className="text-sm text-status-cancelled">{error}</div>}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">{t("cashiers.name")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-border px-3 py-2 text-sm focus:border-black focus:outline-none"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">{t("cashiers.email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-border px-3 py-2 text-sm focus:border-black focus:outline-none"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">{t("cashiers.password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-border px-3 py-2 text-sm focus:border-black focus:outline-none"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-xl bg-black px-4 py-2 text-center text-sm font-medium text-white transition disabled:opacity-60"
          >
            {isSubmitting ? t("cashiers.creating") : t("cashiers.create")}
          </button>
        </form>
      </div>

      {/* Cashiers List */}
      <div className="flex-[2] rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <h2 className="border-b border-border p-6 text-xl font-semibold">{t("cashiers.existing")}</h2>
        {isLoading ? (
          <div className="p-6 text-sm text-text-secondary">{t("cashiers.loading")}</div>
        ) : cashiers.length === 0 ? (
          <div className="p-6 text-sm text-text-secondary">{t("cashiers.noCashiers")}</div>
        ) : (
          <div className="divide-y divide-border">
            {cashiers.map((cashier) => (
              <div key={cashier.id} className="flex items-center justify-between p-6">
                <div>
                  <div className="font-medium text-black">{cashier.name}</div>
                  <div className="text-sm text-text-secondary">{cashier.email}</div>
                  <div className="text-xs text-text-secondary mt-1">
                    {t("cashiers.added")} {format(new Date(cashier.createdAt), 'dd MMM yyyy')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(cashier.id)}
                    className="rounded-lg border border-status-cancelled px-3 py-1.5 text-xs font-semibold text-status-cancelled transition hover:bg-status-cancelled hover:text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
