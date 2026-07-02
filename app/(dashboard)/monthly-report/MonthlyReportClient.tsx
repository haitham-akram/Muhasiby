'use client'

import { useEffect, useState, useCallback } from 'react'
import { useLanguage } from '@/app/providers'

type DayStat = {
  confirmed: number
  pending: number
  cancelled: number
  profit: number
  count: number
}

type MonthlyReport = {
  year: number
  month: number
  totalTransactions: number
  totalConfirmed: number
  totalPending: number
  totalCancelled: number
  totalProfit: number
  byDay: Record<string, DayStat>
  byMethod: Record<string, number>
}

const MONTH_NAMES_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]
const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function MonthlyReportClient() {
  const { t, locale } = useLanguage()
  const currency = t('currency')

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [loading, setLoading] = useState(false)

  const monthNames = locale === 'ar' ? MONTH_NAMES_AR : MONTH_NAMES_EN

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/report/monthly?year=${year}&month=${month}`)
      if (res.ok) {
        const data = await res.json()
        setReport(data)
      }
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  const sortedDays = report ? Object.entries(report.byDay).sort(([a], [b]) => a.localeCompare(b)) : []

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-6 md:py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{t('monthlyReport.title')}</h1>
          <p className="text-sm text-text-secondary">{t('monthlyReport.subtitle')}</p>
        </div>
        {/* Month picker */}
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 shadow-sm">
          <button
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-border transition-colors text-lg font-bold"
          >
            ‹
          </button>
          <span className="min-w-[140px] text-center font-semibold">
            {monthNames[month - 1]} {year}
          </span>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-border transition-colors text-lg font-bold disabled:opacity-30"
          >
            ›
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-text-secondary">
          <svg className="animate-spin h-6 w-6 me-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {t('monthlyReport.loading')}
        </div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[
              { label: t('summaryStats.totalTransactions'), value: report.totalTransactions.toString(), isCurrency: false, highlight: false },
              { label: t('summaryStats.totalConfirmed'),    value: report.totalConfirmed.toFixed(2),    isCurrency: true,  highlight: false },
              { label: t('summaryStats.totalProfit'),       value: report.totalProfit.toFixed(2),       isCurrency: true,  highlight: true  },
              { label: t('summaryStats.totalPending'),      value: report.totalPending.toFixed(2),      isCurrency: true,  highlight: false },
              { label: t('summaryStats.totalCancelled'),    value: report.totalCancelled.toFixed(2),    isCurrency: true,  highlight: false },
            ].map((card) => (
              <div
                key={card.label}
                className={`rounded-2xl border p-4 shadow-sm ${
                  card.highlight
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-border bg-card'
                }`}
              >
                <p className={`text-xs uppercase ${card.highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-secondary'}`}>
                  {card.label}
                </p>
                <p className={`mt-2 text-2xl font-semibold ${card.highlight ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                  {card.value}
                  {card.isCurrency && <span className="ms-1 text-sm font-normal opacity-70">{currency}</span>}
                </p>
              </div>
            ))}
          </div>

          {/* Payment Method Breakdown */}
          {Object.keys(report.byMethod).length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">{t('summaryClient.breakdown')}</h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {Object.entries(report.byMethod).map(([method, amount]) => (
                  <div key={method} className="rounded-xl border border-border bg-background px-4 py-3">
                    <p className="text-xs text-text-secondary">{t(`transactionForm.paymentOptions.${method}`) || method}</p>
                    <p className="mt-1 text-lg font-semibold">{(amount as number).toFixed(2)} <span className="text-sm font-normal opacity-70">{currency}</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Breakdown Table */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">{t('monthlyReport.dailyBreakdown')}</h2>
            {sortedDays.length === 0 ? (
              <p className="text-sm text-text-secondary">{t('monthlyReport.noData')}</p>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="flex flex-col gap-3 md:hidden">
                  {sortedDays.map(([day, stat]) => (
                    <div key={day} className="rounded-xl border border-border bg-background p-4 text-sm">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-semibold">{day}</span>
                        <span className="rounded-full bg-border px-2 py-0.5 text-xs">{stat.count} {t('monthlyReport.transactions')}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-text-secondary">{t('summaryStats.totalConfirmed')}</p>
                          <p className="font-medium">{stat.confirmed.toFixed(2)} {currency}</p>
                        </div>
                        <div>
                          <p className="text-emerald-600 dark:text-emerald-400">{t('summaryStats.totalProfit')}</p>
                          <p className="font-medium text-emerald-600 dark:text-emerald-400">{stat.profit.toFixed(2)} {currency}</p>
                        </div>
                        <div>
                          <p className="text-text-secondary">{t('summaryStats.totalPending')}</p>
                          <p className="font-medium">{stat.pending.toFixed(2)} {currency}</p>
                        </div>
                        <div>
                          <p className="text-text-secondary">{t('summaryStats.totalCancelled')}</p>
                          <p className="font-medium">{stat.cancelled.toFixed(2)} {currency}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-background text-xs uppercase text-text-secondary">
                      <tr>
                        <th className="px-4 py-3">{t('monthlyReport.date')}</th>
                        <th className="px-4 py-3">{t('monthlyReport.transactions')}</th>
                        <th className="px-4 py-3">{t('summaryStats.totalConfirmed')}</th>
                        <th className="px-4 py-3 text-emerald-600 dark:text-emerald-400">{t('summaryStats.totalProfit')}</th>
                        <th className="px-4 py-3">{t('summaryStats.totalPending')}</th>
                        <th className="px-4 py-3">{t('summaryStats.totalCancelled')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDays.map(([day, stat]) => (
                        <tr key={day} className="border-t border-border hover:bg-background/50 transition-colors">
                          <td className="px-4 py-3 font-medium">{day}</td>
                          <td className="px-4 py-3 text-text-secondary">{stat.count}</td>
                          <td className="px-4 py-3">{stat.confirmed.toFixed(2)} <span className="opacity-60 text-xs">{currency}</span></td>
                          <td className="px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">{stat.profit.toFixed(2)} <span className="opacity-60 text-xs">{currency}</span></td>
                          <td className="px-4 py-3">{stat.pending.toFixed(2)} <span className="opacity-60 text-xs">{currency}</span></td>
                          <td className="px-4 py-3">{stat.cancelled.toFixed(2)} <span className="opacity-60 text-xs">{currency}</span></td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Totals footer */}
                    <tfoot className="border-t-2 border-border bg-background font-semibold">
                      <tr>
                        <td className="px-4 py-3">{t('monthlyReport.total')}</td>
                        <td className="px-4 py-3">{report.totalTransactions}</td>
                        <td className="px-4 py-3">{report.totalConfirmed.toFixed(2)} <span className="opacity-60 text-xs">{currency}</span></td>
                        <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">{report.totalProfit.toFixed(2)} <span className="opacity-60 text-xs">{currency}</span></td>
                        <td className="px-4 py-3">{report.totalPending.toFixed(2)} <span className="opacity-60 text-xs">{currency}</span></td>
                        <td className="px-4 py-3">{report.totalCancelled.toFixed(2)} <span className="opacity-60 text-xs">{currency}</span></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
