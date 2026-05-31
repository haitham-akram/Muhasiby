'use client'

import { SessionProvider } from 'next-auth/react'
import React, { createContext, useContext, useState, useEffect } from 'react'
import { getTranslation, type Locale } from '@/lib/i18n'

type LanguageContextType = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export default function Providers({ children, locale: initialLocale }: { children: React.ReactNode; locale: string }) {
  const [locale, setLocaleState] = useState<Locale>((initialLocale as Locale) || 'ar')

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    // Set cookie so Next.js reads it on initial load
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`
    // Force a reload to let tailwind/layout adjust to new direction properly
    window.location.reload()
  }

  const t = (key: string) => getTranslation(locale, key)

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      <SessionProvider>{children}</SessionProvider>
    </LanguageContext.Provider>
  )
}
