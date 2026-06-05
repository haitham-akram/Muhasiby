'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/app/providers'

export default function BottomNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { t } = useLanguage()

  const navItems = [
    { href: '/', label: t('nav.today') },
    { href: '/summary', label: t('nav.summary') },
    { href: '/history', label: t('nav.history') },
  ]

  if (session?.user?.role === 'ADMIN') {
    navItems.push({ href: '/cashiers', label: t('nav.cashiers') })
  }

  return (
    <nav className="fixed bottom-0 z-50 flex w-full justify-around border-t border-border bg-white pb-safe lg:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs transition',
              isActive ? 'font-bold text-black' : 'text-text-secondary',
            )}
          >
            {/* You can inject exact SVG icons here for Mobile items later */}
            <div className={clsx('h-1.5 w-1.5 rounded-full', isActive ? 'bg-black' : 'bg-transparent')} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
