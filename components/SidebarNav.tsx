'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/app/providers'

export default function SidebarNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { t } = useLanguage()

  const navItems = [
    { href: '/', label: t('nav.today') },
    { href: '/summary', label: t('nav.summary') },
    { href: '/monthly-report', label: t('nav.monthlyReport') },
    { href: '/history', label: t('nav.history') },
    { href: '/inventory', label: t('nav.inventory')},
    { href: '/providers', label: t('nav.providers') },
    { href: '/customers', label: t('nav.customers') || 'Customers' },
  ]

  if (session?.user?.role === 'ADMIN') {
    navItems.push({ href: '/cashiers', label: t('nav.manageCashiers') })
  }

  return (
    <nav className="mt-10 flex flex-col gap-2 text-sm text-text-secondary">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'rounded-xl px-3 py-2 transition',
              isActive ? 'bg-black text-white' : 'text-text-secondary hover:bg-black/5',
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
