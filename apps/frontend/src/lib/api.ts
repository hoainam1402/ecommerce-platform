import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor — attach token ────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor — unwrap data + refresh token ────────
api.interceptors.response.use(
  (res) => res.data?.data ?? res.data,
  async (err) => {
    const original = err.config

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) throw new Error('No refresh token')

        const res = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refresh })
        const { accessToken } = res.data.data
        localStorage.setItem('access_token', accessToken)
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err.response?.data ?? err)
  },
)

// ── Typed API helpers ─────────────────────────────────────────
export const authApi = {
  login:    (data: any)  => api.post('/auth/login', data),
  register: (data: any)  => api.post('/auth/register', data),
  logout:   ()           => api.post('/auth/logout'),
  refresh:  (token: string) => api.post('/auth/refresh', { refresh_token: token }),
  me:       ()           => api.get('/users/me'),
}

export const productApi = {
  list:       (params?: any) => api.get('/products', { params }),
  detail:     (id: string)   => api.get(`/products/${id}`),
  reviews:    (id: string, params?: any) => api.get(`/products/${id}/reviews`, { params }),
  addReview:  (id: string, data: any)   => api.post(`/products/${id}/reviews`, data),
  categories: (params?: any) => api.get('/categories', { params }),
}

export const searchApi = {
  search:      (params: any) => api.get('/search/products', { params }),
  autocomplete: (q: string)  => api.get('/search/autocomplete', { params: { q } }),
}

export const cartApi = {
  get:      ()                        => api.get('/cart'),
  add:      (data: any)              => api.post('/cart/items', data),
  update:   (itemId: string, data: any) => api.patch(`/cart/items/${itemId}`, data),
  remove:   (itemId: string)         => api.delete(`/cart/items/${itemId}`),
  applyPromo: (code: string)         => api.post('/cart/apply-promotion', { code }),
  shippingFee: (data: any)           => api.post('/cart/shipping-fee', data),
}

export const orderApi = {
  create:  (data: any)       => api.post('/orders', data),
  list:    (params?: any)    => api.get('/orders', { params }),
  detail:  (id: string)      => api.get(`/orders/${id}`),
  cancel:  (id: string, reason: string) => api.post(`/orders/${id}/cancel`, { reason }),
}

export const promotionApi = {
  validate: (data: any) => api.post('/promotions/validate', data),
  flashSales: ()        => api.get('/promotions/flash-sales'),
}

export const userApi = {
  updateProfile: (data: any)          => api.patch('/users/me', data),
  getAddresses:  ()                   => api.get('/users/me/addresses'),
  addAddress:    (data: any)          => api.post('/users/me/addresses', data),
  updateAddress: (id: string, data: any) => api.put(`/users/me/addresses/${id}`, data),
  deleteAddress: (id: string)         => api.delete(`/users/me/addresses/${id}`),
}
