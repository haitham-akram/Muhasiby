import LogoutButton from '@/components/LogoutButton'
import SidebarNav from '@/components/SidebarNav'
import BottomNav from '@/components/BottomNav'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import ThemeToggle from '@/components/ThemeToggle'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getTranslation, type Locale } from '@/lib/i18n'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const cookieStore = cookies()
  const locale = (cookieStore.get('NEXT_LOCALE')?.value || 'ar') as Locale
  const t = (key: string) => getTranslation(locale, key)

  return (
    <div className="flex min-h-screen bg-background pb-16 lg:pb-0">
      <aside className="hidden w-60 flex-col border-r border-border bg-card px-6 py-8 lg:flex">
        <div className="text-lg font-semibold mb-6 text-text-primary">{t('layout.title')}</div>
        <SidebarNav />
        <div className="mt-auto pt-8 flex flex-col gap-3">
          <LanguageSwitcher />
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <span className="text-sm font-medium text-text-secondary lg:hidden">{t('layout.title')}</span>
          <span className="hidden text-sm text-text-secondary lg:block">{t('layout.subtitle')}</span>
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <LanguageSwitcher />
            </div>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </div>
      <BottomNav />
    </div>
  )
}
