'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { useLanguage } from '@/app/providers'
import { TrendingUp, Clock, FileText, Star } from 'lucide-react'

type StatsProps = {
  sessionId: string
}

type StatsData = {
  confirmedTotal: number
  pendingTotal: number
  txCount: number
  topProduct: string | null
}

export default function StatsBar({ sessionId }: StatsProps) {
  const { t } = useLanguage()
  const { data, error } = useSWR<StatsData>(
    `/api/stats?sessionId=${sessionId}`,
    fetcher,
    { refreshInterval: 30000 } // Auto-refresh every 30s
  )

  if (!data) return null // Could show skeletons here

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-status-confirmed/10 text-status-confirmed">
          <TrendingUp size={20} />
        </div>
        <div>
          <div className="text-xs text-text-secondary">{t('summaryStats.totalConfirmed')}</div>
          <div className="text-lg font-semibold">{data.confirmedTotal.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-status-pending/10 text-status-pending">
          <Clock size={20} />
        </div>
        <div>
          <div className="text-xs text-text-secondary">{t('summaryStats.totalPending')}</div>
          <div className="text-lg font-semibold">{data.pendingTotal.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
          <FileText size={20} />
        </div>
        <div>
          <div className="text-xs text-text-secondary">{t('summaryStats.totalTransactions')}</div>
          <div className="text-lg font-semibold">{data.txCount}</div>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-500">
          <Star size={20} />
        </div>
        <div>
          <div className="text-xs text-text-secondary">Top Product</div>
          <div className="text-sm font-semibold truncate max-w-[100px]">{data.topProduct || '—'}</div>
        </div>
      </div>
    </div>
  )
}
