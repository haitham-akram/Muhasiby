'use client'

import StatusBadge from '@/components/StatusBadge'
import type { Transaction, TransactionStatus } from '@/lib/types'
import { useLanguage } from '@/app/providers'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

type TransactionTableProps = {
  transactions: Transaction[]
  onToggleStatus: (transaction: Transaction, status: TransactionStatus) => void
  onDelete: (transaction: Transaction) => void
}

const statusOrder: TransactionStatus[] = ['CONFIRMED', 'PENDING', 'CANCELLED']

function getNextStatus(current: TransactionStatus) {
  const index = statusOrder.indexOf(current)
  return statusOrder[(index + 1) % statusOrder.length]
}

export default function TransactionTable({ transactions, onToggleStatus, onDelete }: TransactionTableProps) {
  const { t } = useLanguage()
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180, // estimated height of row
    overscan: 5,
  })

  if (!transactions.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-text-secondary">
        {t('transactionTable.noTransactionsYet')}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div 
        ref={parentRef} 
        className="max-h-[600px] overflow-auto relative"
      >
        {/* Mobile View */}
        <div 
          className="md:hidden"
          style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const transaction = transactions[virtualRow.index]
            const index = virtualRow.index
            return (
              <div 
                key={transaction.id} 
                className="absolute top-0 left-0 w-full border-b border-border p-4 bg-card"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase text-text-secondary">#{index + 1}</p>
                    <p className="mt-1 font-medium">{transaction.buyerName}</p>
                  </div>
                  <StatusBadge
                    status={transaction.status}
                    onClick={() => onToggleStatus(transaction, getNextStatus(transaction.status))}
                  />
                </div>

                <dl className="mt-4 grid gap-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-text-secondary">{t('transactionTable.items')}</dt>
                    <dd className="text-right">{transaction.items}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-text-secondary">{t('transactionTable.paymentMethod')}</dt>
                    <dd className="text-right">{transaction.paymentMethod}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-text-secondary">{t('transactionTable.amount')}</dt>
                    <dd className="text-right">{transaction.amount.toFixed(2)}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex justify-end">
                  <button className="text-xs font-medium text-status-cancelled" onClick={() => onDelete(transaction)}>
                    {t('transactionTable.delete')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop View */}
        <div className="hidden w-full text-left text-sm whitespace-nowrap md:block relative">
          <div className="bg-background text-xs uppercase text-text-secondary sticky top-0 z-10 shadow-sm flex items-center border-b border-border w-full">
            <div className="px-4 py-3 w-[50px] shrink-0">#</div>
            <div className="px-4 py-3 w-[150px] shrink-0">{t('transactionTable.buyerName')}</div>
            <div className="px-4 py-3 flex-1 min-w-[200px]">{t('transactionTable.items')}</div>
            <div className="px-4 py-3 w-[150px] shrink-0">{t('transactionTable.paymentMethod')}</div>
            <div className="px-4 py-3 w-[100px] shrink-0">{t('transactionTable.amount')}</div>
            <div className="px-4 py-3 w-[150px] shrink-0">{t('transactionTable.status')}</div>
            <div className="px-4 py-3 w-[150px] shrink-0">{t('transactionTable.phone')}</div>
            <div className="px-4 py-3 w-[100px] shrink-0">{t('transactionTable.actions')}</div>
          </div>
          <div style={{ height: `${virtualizer.getTotalSize()}px`, display: 'block', position: 'relative', width: '100%' }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const transaction = transactions[virtualRow.index]
              const index = virtualRow.index
              return (
                <div 
                  key={transaction.id} 
                  className="border-b border-border absolute top-0 left-0 w-full flex items-center bg-card hover:bg-black/5 dark:hover:bg-white/5 transition"
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`
                  }}
                >
                  <div className="px-4 py-3 w-[50px] shrink-0">{index + 1}</div>
                  <div className="px-4 py-3 w-[150px] shrink-0 font-medium truncate">{transaction.buyerName}</div>
                  <div className="px-4 py-3 flex-1 min-w-[200px] text-text-secondary truncate">{transaction.items}</div>
                  <div className="px-4 py-3 w-[150px] shrink-0">{transaction.paymentMethod}</div>
                  <div className="px-4 py-3 w-[100px] shrink-0">{transaction.amount.toFixed(2)}</div>
                  <div className="px-4 py-3 w-[150px] shrink-0">
                    <StatusBadge
                      status={transaction.status}
                      onClick={() => onToggleStatus(transaction, getNextStatus(transaction.status))}
                    />
                  </div>
                  <div className="px-4 py-3 w-[150px] shrink-0 text-text-secondary">{transaction.buyerPhone || '—'}</div>
                  <div className="px-4 py-3 w-[100px] shrink-0">
                    <button className="text-xs font-medium text-status-cancelled hover:underline" onClick={() => onDelete(transaction)}>
                      {t('transactionTable.delete')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
