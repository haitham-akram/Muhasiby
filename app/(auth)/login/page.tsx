'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useLanguage } from '@/app/providers'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function LoginPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '')
    const password = String(formData.get('password') || '')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setIsSubmitting(false)

    if (result?.error) {
      setError('Invalid email or password.')
      return
    }

    router.push('/')
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm relative">
      <div className="absolute top-4 right-4 rtl:left-4 rtl:right-auto">
        <LanguageSwitcher />
      </div>
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-semibold">{t('login.title')}</h1>
        <p className="text-sm text-text-secondary">{t('appName')}</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm">
          {t('login.email')}
          <input
            type="email"
            name="email"
            className="rounded-xl border border-border px-3 py-2"
            placeholder="cashier@example.com"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          {t('login.password')}
          <input
            type="password"
            name="password"
            className="rounded-xl border border-border px-3 py-2"
            placeholder="••••••••"
            required
          />
        </label>
        {error ? <p className="text-sm text-status-cancelled">{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={isSubmitting}
        >
          {isSubmitting ? '...' : t('login.button')}
        </button>
      </form>
    </div>
  )
}
