import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { Transaction } from '@/lib/types'

export function useTransactions(sessionId?: string) {
  const { data, error, mutate } = useSWR<{ transactions: Transaction[] }>(
    sessionId ? `/api/transactions?sessionId=${sessionId}` : null,
    fetcher
  )

  return {
    transactions: data?.transactions ?? [],
    isLoading: !error && !data && !!sessionId,
    isError: error,
    mutateTransactions: mutate,
  }
}
