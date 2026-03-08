'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Minus, Plus, Tag, ArrowRight, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'
import { cartApi, promotionApi } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { cn, formatPrice } from '@/lib/utils'

export default function CartPage() {
  const { cart, updateItem, removeItem, isLoading, fetchCart } = useCartStore()
  const [promoCode, setPromoCode]       = useState('')
  const [promoError, setPromoError]     = useState('')
  const [promoSuccess, setPromoSuccess] = useState('')
  const [discount, setDiscount]         = useState(0)
  const [selected, setSelected]         = useState<Set<string>>(
    new Set(cart?.items.filter(i => !i.isOutOfStock).map(i => i.id) ?? []),
  )

  const toggleSelect = (id: string) => {
    setSelected(s => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const toggleAll = () => {
    const validIds = cart?.items.filter(i => !i.isOutOfStock).map(i => i.id) ?? []
    if (selected.size === validIds.length) setSelected(new Set())
    else setSelected(new Set(validIds))
  }

  const applyPromo = async () => {
    setPromoError('')
    setPromoSuccess('')
    if (!promoCode.trim()) return
    try {
      const res: any = await cartApi.applyPromo(promoCode)
      setDiscount(res.discountAmount ?? 0)
      setPromoSuccess(`Áp dụng thành công! Giảm ${formatPrice(res.discountAmount)}`)
      fetchCart()
    } catch (err: any) {
      setPromoError(err?.error?.message ?? 'Mã không hợp lệ')
    }
  }

  const selectedItems  = cart?.items.filter(i => selected.has(i.id)) ?? []
  const subtotal       = selectedItems.reduce((s, i) => s + i.totalPrice, 0)
  const shipping       = subtotal >= 300_000 ? 0 : 30_000
  const total          = subtotal + shipping - discount

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-page py-20 flex flex-col items-center gap-6 text-center">
        <ShoppingBag className="h-20 w-20 text-border" />
        <div>
          <h2 className="text-xl font-bold text-text-primary">Giỏ hàng trống</h2>
          <p className="text-text-secondary mt-1 text-sm">Hãy thêm sản phẩm yêu thích vào giỏ hàng</p>
        </div>
        <Button variant="primary" size="lg">
          <Link href="/products">Tiếp tục mua sắm</Link>
        </Button>
      </div>
    )
  }

  const allValidIds  = cart.items.filter(i => !i.isOutOfStock).map(i => i.id)
  const allSelected  = allValidIds.length > 0 && allValidIds.every(id => selected.has(id))

  return (
    <div className="container-page py-6">
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        Giỏ hàng ({cart.itemCount})
      </h1>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Items */}
        <div className="lg:col-span-2 space-y-0 bg-white rounded-2xl shadow-card overflow-hidden">
          {/* Select all */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface">
            <input type="checkbox" checked={allSelected} onChange={toggleAll}
              className="h-4 w-4 accent-primary rounded cursor-pointer" />
            <span className="text-sm font-medium">Chọn tất cả ({allValidIds.length})</span>
          </div>

          {/* Cart items */}
          {cart.items.map(item => (
            <div key={item.id}
              className={cn('flex gap-4 px-4 py-4 border-b border-border last:border-0',
                item.isOutOfStock && 'opacity-60')}>
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                disabled={item.isOutOfStock}
                onChange={() => toggleSelect(item.id)}
                className="h-4 w-4 accent-primary rounded mt-1 flex-shrink-0 cursor-pointer disabled:cursor-not-allowed"
              />

              {/* Image */}
              <div className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-surface">
                <Image
                  src={item.product.image || '/placeholder-product.jpg'}
                  alt={item.product.name} fill className="object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.product.slug}`}
                  className="text-sm font-medium text-text-primary hover:text-primary line-clamp-2">
                  {item.product.name}
                </Link>
                {item.variant && (
                  <p className="text-xs text-text-secondary mt-0.5">{item.variant.name}</p>
                )}
                {item.isOutOfStock && (
                  <span className="inline-block mt-1 text-xs bg-surface text-accent px-2 py-0.5 rounded-full font-medium">
                    Hết hàng
                  </span>
                )}
                <p className="text-primary font-bold mt-1">{formatPrice(item.unitPrice)}</p>

                {/* Controls */}
                <div className="flex items-center justify-between mt-2">
                  {!item.isOutOfStock ? (
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                      <button onClick={() => updateItem(item.id, item.quantity - 1)}
                        disabled={isLoading || item.quantity <= 1}
                        className="h-7 w-7 flex items-center justify-center hover:bg-surface disabled:opacity-40">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="h-7 w-8 flex items-center justify-center text-sm font-medium border-x border-border">
                        {item.quantity}
                      </span>
                      <button onClick={() => updateItem(item.id, item.quantity + 1)}
                        disabled={isLoading}
                        className="h-7 w-7 flex items-center justify-center hover:bg-surface disabled:opacity-40">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      Thông báo khi có hàng
                    </Button>
                  )}

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">{formatPrice(item.totalPrice)}</span>
                    <button onClick={() => removeItem(item.id)}
                      className="text-text-secondary hover:text-accent transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl shadow-card p-5 space-y-4 sticky top-20">
          <h3 className="font-semibold text-text-primary">Tóm tắt đơn hàng</h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Tạm tính ({selectedItems.length} sản phẩm)</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Phí vận chuyển</span>
              <span className={shipping === 0 ? 'text-success font-medium' : ''}>
                {shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success">
                <span>Giảm giá voucher</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-border flex justify-between font-bold text-base">
              <span>Tổng cộng</span>
              <span className="text-primary text-xl">{formatPrice(total)}</span>
            </div>
          </div>

          {/* Voucher */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                <input
                  type="text" placeholder="Nhập mã giảm giá"
                  value={promoCode}
                  onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); setPromoSuccess('') }}
                  className="input-base pl-9 h-9 text-sm"
                />
              </div>
              <Button variant="outline" size="sm" onClick={applyPromo}>
                Áp dụng
              </Button>
            </div>
            {promoError   && <p className="text-xs text-accent">{promoError}</p>}
            {promoSuccess && <p className="text-xs text-success">{promoSuccess}</p>}
            {subtotal < 300_000 && (
              <p className="text-xs text-text-secondary">
                Mua thêm <span className="text-primary font-medium">{formatPrice(300_000 - subtotal)}</span> để được miễn phí vận chuyển
              </p>
            )}
          </div>

          <Button
            variant="primary" size="lg"
            className="w-full"
            disabled={selectedItems.length === 0}
            rightIcon={<ArrowRight className="h-5 w-5" />}
          >
            <Link href={`/checkout?items=${[...selected].join(',')}`}>
              Tiến hành thanh toán
            </Link>
          </Button>

          <p className="text-xs text-center text-text-secondary">
            🔒 Thanh toán an toàn & bảo mật
          </p>
        </div>
      </div>
    </div>
  )
}
