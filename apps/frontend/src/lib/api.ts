'use client'
import axios from 'axios'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

export const api = axios.create({ baseURL: BASE, withCredentials: false })

// ── Token inject ──────────────────────────────────────────
api.interceptors.request.use(cfg => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('auth-storage')
    if (raw) {
      try {
        const { state } = JSON.parse(raw)
        if (state?.accessToken) cfg.headers.Authorization = `Bearer ${state.accessToken}`
      } catch {}
    }
  }
  return cfg
})

// ── Auto refresh on 401 ───────────────────────────────────
api.interceptors.response.use(
  r => r,
  async err => {
    const orig = err.config
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true
      try {
        const raw = localStorage.getItem('auth-storage')
        const { state } = JSON.parse(raw || '{}')
        if (state?.refreshToken) {
          const { data } = await axios.post(`${BASE}/auth/refresh`, { refresh_token: state.refreshToken })
          const newToken = data.data.accessToken
          const parsed = JSON.parse(raw!)
          parsed.state.accessToken = newToken
          localStorage.setItem('auth-storage', JSON.stringify(parsed))
          orig.headers.Authorization = `Bearer ${newToken}`
          return api(orig)
        }
      } catch {}
    }
    return Promise.reject(err)
  }
)

// ── Helpers ───────────────────────────────────────────────
const get  = <T>(url: string, params?: object) => api.get<{success:boolean;data:T;meta?:any}>(url, { params }).then(r => r.data)
const post = <T>(url: string, body?: object)   => api.post<{success:boolean;data:T}>(url, body).then(r => r.data)
const patch = <T>(url: string, body?: object)  => api.patch<{success:boolean;data:T}>(url, body).then(r => r.data)
const del   = (url: string)                     => api.delete(url).then(r => r.data)

// ── Auth ──────────────────────────────────────────────────
export const authApi = {
  login:    (email: string, password: string) => post<any>('/auth/login', { email, password }),
  register: (body: any)  => post<any>('/auth/register', body),
  refresh:  (token: string) => post<any>('/auth/refresh', { refresh_token: token }),
  logout:   ()           => post('/auth/logout'),
  me:       ()           => get<any>('/users/me'),
}

// ── Products ──────────────────────────────────────────────
export const productApi = {
  list: (params?: {
    page?: number; limit?: number; q?: string
    category_id?: string; brand_id?: string
    min_price?: number; max_price?: number
    min_rating?: number; sort?: string
  }) => get<any[]>('/products', params),

  detail: (slug: string) => get<any>(`/products/${slug}`),
  reviews: (id: string, params?: any) => get<any[]>(`/products/${id}/reviews`, params),
  categories: () => get<any[]>('/categories'),
}

// ── Cart ──────────────────────────────────────────────────
export const cartApi = {
  get:    ()           => get<any>('/cart'),
  add:    (body: any)  => post<any>('/cart/items', body),
  update: (id: string, quantity: number) => patch<any>(`/cart/items/${id}`, { quantity }),
  remove: (id: string) => del(`/cart/items/${id}`),
  applyPromo: (code: string) => post<any>('/cart/apply-promotion', { code }),
  shippingFee: (body: any)   => post<any>('/cart/shipping-fee', body),
}

// ── Orders ────────────────────────────────────────────────
export const orderApi = {
  list:   (params?: any) => get<any[]>('/orders', params),
  detail: (id: string)   => get<any>(`/orders/${id}`),
  create: (body: any)    => post<any>('/orders', body),
  cancel: (id: string, reason: string) => post(`/orders/${id}/cancel`, { reason }),
}

// ── Payments ──────────────────────────────────────────────
export const paymentApi = {
  initiate: (orderId: string) => post<any>(`/payments/${orderId}/initiate`),
}

// ── Promotions ────────────────────────────────────────────
export const promotionApi = {
  validate:   (code: string, amount: number) => post<any>('/promotions/validate', { code, order_amount: amount }),
  flashSales: () => get<any[]>('/promotions/flash-sales'),
}

// ── Users ─────────────────────────────────────────────────
export const userApi = {
  updateProfile: (body: any) => patch<any>('/users/me', body),
  addresses:     ()          => get<any[]>('/users/me/addresses'),
  addAddress:    (body: any) => post<any>('/users/me/addresses', body),
  updateAddress: (id: string, body: any) => patch<any>(`/users/me/addresses/${id}`, body),
  deleteAddress: (id: string)            => del(`/users/me/addresses/${id}`),
}
