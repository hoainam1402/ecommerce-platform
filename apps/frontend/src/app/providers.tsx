'use client'
import { useAuthStore } from '@/stores/auth.store'
import { useCartStore } from '@/stores/cart.store'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

function AppInit() {
  const { user, fetchMe, accessToken } = useAuthStore()
  const { fetchCart } = useCartStore()

  useEffect(() => {
    // Only fetch data if user is logged in
    if (accessToken) {
      if (!user) fetchMe()
      fetchCart()
    }
  }, [accessToken]) // Only depend on accessToken

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <AppInit />
      {children}
    </QueryClientProvider>
  )
}
