import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Institute data changes on a human timescale. 30s keeps rosters and
      // arrears feeling live without hammering the API from a dozen tabs.
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => {
        // Never retry a rejection the user must act on — a 401/403/404 will
        // fail identically three more times and just delay the error.
        if (isAxiosError(error)) {
          const status = error.response?.status
          if (status && status >= 400 && status < 500) return false
        }
        return failureCount < 2
      },
    },
    mutations: {
      // Money and attendance writes are never retried automatically: a
      // network timeout does not mean the server rejected the payment, and a
      // blind retry risks a duplicate receipt. Retries are the user's call.
      retry: false,
    },
  },
})
