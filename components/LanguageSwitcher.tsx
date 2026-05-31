'use client'

import { useLanguage } from '@/app/providers'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage()

  return (
    <button
      onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
      className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition hover:bg-neutral-100"
    >
      {locale === 'ar' ? 'English' : 'العربية'}
    </button>
  )
}
