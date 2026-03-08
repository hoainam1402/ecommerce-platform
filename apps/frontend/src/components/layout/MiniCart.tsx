'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X, ShoppingCart, Plus, Minus, Trash2, ArrowRight } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { useCartStore } from '@/stores/cart.store'

export function MiniCart() {
  const { open, setOpen, items, subtotal, itemCount, updateItem, removeItem, fetchCart } = useCartStore()

  useEffect(() => { if (open) fetchCart() }, [open])

  return (
    <>
      {/* Backdrop */}
      <div onClick={() => setOpen(false)}
        className={cn('fixed inset-0 bg-black/40 z-40 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none')} />

      {/* Drawer */}
      <aside className={cn(
        'fixed right-0 top-0 h-full w-full sm:w-96 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="font-display font-bold text-lg">Giỏ hàng</h2>
            {itemCount > 0 && (
              <span className="badge-primary">{itemCount}</span>
            )}
          </div>
          <button onClick={() => setOpen(false)} className="btn-ghost p-1.5 rounded-xl">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-4 px-5 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center">
              <div className="h-20 w-20 bg-surface rounded-full flex items-center justify-center">
                <ShoppingCart className="h-9 w-9 text-text-muted" />
              </div>
              <div>
                <p className="font-semibold text-text-primary">Giỏ hàng trống</p>
                <p className="text-sm text-text-muted mt-1">Thêm sản phẩm để bắt đầu mua sắm</p>
              </div>
              <button onClick={() => setOpen(false)} className="btn-primary">
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-3">
                {/* Image */}
                <div className="relative h-18 w-18 shrink-0 rounded-xl overflow-hidden bg-surface border border-border">
                  <Image
                    src={item.product?.image ?? `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80`}
                    alt={item.product?.name ?? ''}
                    fill className="object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product?.slug}`} onClick={() => setOpen(false)}
                    className="text-sm font-medium text-text-primary hover:text-primary line-clamp-2 leading-snug">
                    {item.product?.name}
                  </Link>
                  {item.variant && (
                    <p className="text-xs text-text-muted mt-0.5">{item.variant.name}</p>
                  )}
                  <p className="font-bold text-accent mt-1">{formatPrice(item.unit_price)}</p>

                  {/* Quantity */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                      <button onClick={() => updateItem(item.id, item.quantity - 1)}
                        className="px-2.5 py-1 hover:bg-surface transition-colors">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center border-x border-border">
                        {item.quantity}
                      </span>
                      <button onClick={() => updateItem(item.id, item.quantity + 1)}
                        className="px-2.5 py-1 hover:bg-surface transition-colors">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.id)}
                      className="p-1.5 text-text-muted hover:text-danger transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-5 py-4 space-y-3 bg-surface/50">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Tạm tính</span>
              <span className="font-display font-bold text-lg">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-text-muted">Phí vận chuyển tính khi thanh toán</p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/cart" onClick={() => setOpen(false)} className="btn-outline text-center">
                Xem giỏ hàng
              </Link>
              <Link href="/checkout" onClick={() => setOpen(false)} className="btn-accent flex items-center justify-center gap-1.5">
                Thanh toán <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
