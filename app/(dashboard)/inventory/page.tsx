import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import InventoryClient from './InventoryClient'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { getTranslation, type Locale } from '@/lib/i18n'

export const metadata = {
  title: 'Inventory | Muhasiby',
}

export default async function InventoryPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login')
  }

  const cookieStore = cookies()
  const locale = (cookieStore.get('NEXT_LOCALE')?.value || 'ar') as Locale
  const t = (key: string) => getTranslation(locale, key)

  // Basic reporting: Top selling items (by quantity) - still server-side
  const topItems = await prisma.transactionItem.groupBy({
    by: ['productId', 'name'],
    _sum: {
      quantity: true,
      totalPrice: true,
    },
    orderBy: {
      _sum: {
        quantity: 'desc',
      },
    },
    take: 10,
  })

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold">{t('inventory.title')}</h1>
        <p className="text-sm text-text-secondary">{t('inventory.subtitle')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Reports Section */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">{t('inventory.topSelling')}</h2>
            {topItems.length === 0 ? (
              <p className="text-sm text-text-secondary">{t('inventory.noSalesData')}</p>
            ) : (
              <ul className="space-y-3">
                {topItems.map((item) => (
                  <li key={item.productId || item.name} className="flex justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-text-secondary">{item._sum.quantity} {t('inventory.sold')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{item._sum.totalPrice?.toFixed(2)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <InventoryClient />
        </div>
      </div>
    </div>
  )
}