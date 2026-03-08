import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/lib/api'

interface User {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  role: string
  loyaltyPoints: number
  loyaltyTier: string
}

interface AuthState {
  user:         User | null
  accessToken:  string | null
  refreshToken: string | null
  isLoading:    boolean

  login:    (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout:   () => Promise<void>
  fetchMe:  () => Promise<void>
  setTokens: (access: string, refresh: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,
      isLoading:    false,

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        set({ accessToken, refreshToken })
      },

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const data: any = await authApi.login({ email, password })
          get().setTokens(data.accessToken, data.refreshToken)
          set({ user: data.user, isLoading: false })
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      register: async (data) => {
        set({ isLoading: true })
        try {
          const res: any = await authApi.register(data)
          get().setTokens(res.accessToken, res.refreshToken)
          set({ user: res.user, isLoading: false })
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      logout: async () => {
        try { await authApi.logout() } catch {}
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, refreshToken: null })
      },

      fetchMe: async () => {
        try {
          const user: any = await authApi.me()
          set({ user })
        } catch {
          set({ user: null })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
      }),
    },
  ),
)
