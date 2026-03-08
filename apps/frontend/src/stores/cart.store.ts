import { create } from 'zustand'
import { cartApi } from '@/lib/api'

interface CartItem {
  id: string
  product: { id: string; name: string; image: string; slug: string }
  variant?: { id: string; name: string; sku: string }
  quantity: number
  unitPrice: number
  totalPrice: number
  isOutOfStock?: boolean
}

interface Cart {
  id: string
  items: CartItem[]
  subtotal: number
  itemCount: number
}

interface CartState {
  cart:        Cart | null
  isOpen:      boolean   // mini cart drawer
  isLoading:   boolean

  fetchCart:    () => Promise<void>
  addItem:      (productId: string, variantId?: string, qty?: number) => Promise<void>
  updateItem:   (itemId: string, quantity: number) => Promise<void>
  removeItem:   (itemId: string) => Promise<void>
  openCart:     () => void
  closeCart:    () => void
  toggleCart:   () => void
}

export const useCartStore = create<CartState>()((set, get) => ({
  cart:      null,
  isOpen:    false,
  isLoading: false,

  fetchCart: async () => {
    try {
      const cart: any = await cartApi.get()
      set({ cart })
    } catch {}
  },

  addItem: async (productId, variantId, qty = 1) => {
    set({ isLoading: true })
    try {
      const cart: any = await cartApi.add({ productId, variantId, quantity: qty })
      set({ cart, isOpen: true, isLoading: false })
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  updateItem: async (itemId, quantity) => {
    set({ isLoading: true })
    try {
      const cart: any = quantity === 0
        ? await cartApi.remove(itemId)
        : await cartApi.update(itemId, { quantity })
      set({ cart: quantity === 0 ? get().cart : cart, isLoading: false })
      if (quantity === 0) get().fetchCart()
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  removeItem: async (itemId) => {
    set({ isLoading: true })
    try {
      await cartApi.remove(itemId)
      await get().fetchCart()
      set({ isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  openCart:   () => set({ isOpen: true }),
  closeCart:  () => set({ isOpen: false }),
  toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
}))
