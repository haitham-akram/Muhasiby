import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { Session } from '@/lib/types'

export function useSession() {
  const { data, error, mutate } = useSWR<{ session: Session | null }>('/api/sessions?today=true', fetcher)

  return {
    session: data?.session,
    isLoading: !error && !data,
    isError: error,
    mutateSession: mutate,
  }
}
