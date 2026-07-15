'use client'

import { SessionProvider } from 'next-auth/react'
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getTranslation, type Locale } from '@/lib/i18n'
import { SyncProvider } from '@/lib/sync/syncContext'

// ─── Language Context ─────────────────────────────────
type LanguageContextType = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider')
  return context
}

// ─── Theme Context ────────────────────────────────────
type Theme = 'light' | 'dark'

type ThemeContextType = {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within Providers')
  return context
}

// ─── Providers ────────────────────────────────────────
export default function Providers({
  children,
  locale: initialLocale,
}: {
  children: React.ReactNode
  locale: string
}) {
  const [locale, setLocaleState] = useState<Locale>((initialLocale as Locale) || 'ar')
  const [theme, setTheme] = useState<Theme>('light')

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('muhasiby-theme') as Theme | null
    const preferred = saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    setTheme(preferred)
    document.documentElement.classList.toggle('dark', preferred === 'dark')
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('muhasiby-theme', next)
      document.documentElement.classList.toggle('dark', next === 'dark')
      return next
    })
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`
    window.location.reload()
  }

  const t = (key: string) => getTranslation(locale, key)

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <LanguageContext.Provider value={{ locale, setLocale, t }}>
        <SessionProvider>
          <SyncProvider>{children}</SyncProvider>
        </SessionProvider>
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  )
}
