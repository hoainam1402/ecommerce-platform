'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X, ShoppingCart, Minus, Plus, Trash2, ArrowRight } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { useCartStore } from '@/stores/cart.store'
import { Button } from '@/components/ui/Button'

export function MiniCart() {
  const { cart, isOpen, closeCart, updateItem, removeItem, isLoading } = useCartStore()

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div className={cn(
        'fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300',
        isOpen ? 'translate-x-0' : 'translate-x-full',
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-text-primary">
              Giỏ hàng ({cart?.itemCount ?? 0})
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-2">
          {!cart || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-text-secondary">
              <ShoppingCart className="h-16 w-16 opacity-20" />
              <p className="text-sm">Giỏ hàng trống</p>
              <Button variant="outline" size="sm" onClick={closeCart}>
                Tiếp tục mua sắm
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {cart.items.map(item => (
                <li key={item.id} className={cn(
                  'flex gap-3 px-4 py-3',
                  item.isOutOfStock && 'opacity-50',
                )}>
                  {/* Image */}
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-surface">
                    <Image
                      src={item.product.image || '/placeholder-product.jpg'}
                      alt={item.product.name}
                      fill className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product.slug}`}
                      onClick={closeCart}
                      className="text-sm font-medium line-clamp-2 text-text-primary hover:text-primary transition-colors"
                    >
                      {item.product.name}
                    </Link>
                    {item.variant && (
                      <p className="text-xs text-text-secondary mt-0.5">{item.variant.name}</p>
                    )}
                    <p className="text-sm font-bold text-primary mt-1">
                      {formatPrice(item.unitPrice)}
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateItem(item.id, item.quantity - 1)}
                          disabled={isLoading || item.quantity <= 1}
                          className="h-7 w-7 flex items-center justify-center hover:bg-surface disabled:opacity-40 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="h-7 w-8 flex items-center justify-center text-sm font-medium border-x border-border">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateItem(item.id, item.quantity + 1)}
                          disabled={isLoading}
                          className="h-7 w-7 flex items-center justify-center hover:bg-surface disabled:opacity-40 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="h-7 w-7 flex items-center justify-center text-text-secondary hover:text-accent transition-colors ml-auto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cart && cart.items.length > 0 && (
          <div className="border-t border-border p-4 space-y-3 bg-surface/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Tạm tính</span>
              <span className="font-bold text-lg text-text-primary">{formatPrice(cart.subtotal)}</span>
            </div>
            <p className="text-xs text-text-secondary">Phí vận chuyển tính khi thanh toán</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={closeCart}
                className="w-full"
                leftIcon={<ShoppingCart className="h-4 w-4" />}
              >
                <Link href="/cart" onClick={closeCart}>Xem giỏ</Link>
              </Button>
              <Button
                variant="primary"
                className="w-full"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                <Link href="/checkout" onClick={closeCart}>Thanh toán</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
