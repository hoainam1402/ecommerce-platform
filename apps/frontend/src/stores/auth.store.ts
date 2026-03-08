'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/lib/api'

interface User { id: string; email: string; full_name: string; role: string; avatar_url?: string; loyalty_points?: number; loyalty_tier?: string }

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  loading: boolean

  login:  (email: string, password: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
  setTokens: (access: string, refresh: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, accessToken: null, refreshToken: null, loading: false,

      login: async (email, password) => {
        set({ loading: true })
        try {
          const res = await authApi.login(email, password)
          const { accessToken, refreshToken, user } = res.data
          set({ accessToken, refreshToken, user, loading: false })
        } catch (e) {
          set({ loading: false })
          throw e
        }
      },

      logout: () => {
        authApi.logout().catch(() => {})
        set({ user: null, accessToken: null, refreshToken: null })
      },

      fetchMe: async () => {
        try {
          const res = await authApi.me()
          set({ user: res.data })
        } catch { set({ user: null, accessToken: null }) }
      },

      setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
    }),
    { name: 'auth-storage', partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken, user: s.user }) }
  )
)
