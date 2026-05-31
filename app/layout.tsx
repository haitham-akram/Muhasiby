import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'Cashier Ledger',
  description: 'Daily sales tracking and reconciliation for cashiers.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'ar'
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir} className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  )
}
