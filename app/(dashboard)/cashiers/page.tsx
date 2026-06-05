import CashiersClient from '@/components/CashiersClient'
import { cookies } from 'next/headers'
import { getTranslation, type Locale } from '@/lib/i18n'

export default function CashiersPage() {
  const cookieStore = cookies()
  const locale = (cookieStore.get('NEXT_LOCALE')?.value || 'ar') as Locale
  const t = (key: string) => getTranslation(locale, key)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="mb-4">
        <h1 className="text-3xl font-semibold">{t('cashiers.title')}</h1>
        <p className="text-sm text-text-secondary">{t('cashiers.subtitle')}</p>
      </div>
      <CashiersClient />
    </div>
  )
}
