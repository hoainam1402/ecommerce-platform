'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { cartApi } from '@/lib/api'

interface CartItem {
  id: string
  product: { id: string; name: string; slug: string; image?: string }
  variant?: { id: string; name: string; sku?: string }
  quantity: number
  unit_price: number
  total_price: number
}

interface CartState {
  items: CartItem[]
  subtotal: number
  itemCount: number
  loading: boolean
  open: boolean

  setOpen: (v: boolean) => void
  fetchCart: () => Promise<void>
  addItem: (productId: string, quantity: number, variantId?: string) => Promise<void>
  updateItem: (id: string, quantity: number) => Promise<void>
  removeItem: (id: string) => Promise<void>
  clear: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [], subtotal: 0, itemCount: 0, loading: false, open: false,

      setOpen: (v) => set({ open: v }),

      fetchCart: async () => {
        try {
          const res = await cartApi.get()
          const cart = res.data
          set({
            items:     cart?.items ?? [],
            subtotal:  cart?.subtotal ?? 0,
            itemCount: cart?.item_count ?? 0,
          })
        } catch { /* guest: ignore */ }
      },

      addItem: async (productId, quantity, variantId) => {
        set({ loading: true })
        try {
          const res = await cartApi.add({ product_id: productId, variant_id: variantId, quantity })
          const cart = res.data
          set({
            items:     cart?.items ?? [],
            subtotal:  cart?.subtotal ?? 0,
            itemCount: cart?.item_count ?? 0,
            open:      true,
          })
        } finally {
          set({ loading: false })
        }
      },

      updateItem: async (id, quantity) => {
        if (quantity === 0) { get().removeItem(id); return }
        try {
          const res = await cartApi.update(id, quantity)
          const cart = res.data
          set({ items: cart?.items ?? [], subtotal: cart?.subtotal ?? 0, itemCount: cart?.item_count ?? 0 })
        } catch {}
      },

      removeItem: async (id) => {
        try {
          await cartApi.remove(id)
          await get().fetchCart()
        } catch {}
      },

      clear: () => set({ items: [], subtotal: 0, itemCount: 0 }),
    }),
    { name: 'cart-storage', partialize: (s) => ({ items: s.items, subtotal: s.subtotal, itemCount: s.itemCount }) }
  )
)
