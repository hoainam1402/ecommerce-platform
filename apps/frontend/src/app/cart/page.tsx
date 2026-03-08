'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { Trash2, Plus, Minus, Tag, ArrowRight, ShoppingBag, RefreshCw } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'
import { promotionApi } from '@/lib/api'
import { cn, formatPrice } from '@/lib/utils'

export default function CartPage() {
  const { items, subtotal, fetchCart, updateItem, removeItem } = useCartStore()
  const [voucher,  setVoucher]  = useState('')
  const [discount, setDiscount] = useState(0)
  const [voucherMsg, setVoucherMsg] = useState('')
  const [voucherOk,  setVoucherOk]  = useState(false)
  const [applying, setApplying] = useState(false)

  useEffect(() => { fetchCart() }, [])

  const shipping = subtotal > 299000 ? 0 : 30000
  const total    = subtotal - discount + shipping

  const applyVoucher = async () => {
    if (!voucher.trim()) return
    setApplying(true)
    try {
      const res = await promotionApi.validate(voucher.trim(), subtotal)
      const d = res.data
      if (d.is_valid) {
        setDiscount(d.discount_amount ?? 0)
        setVoucherOk(true)
        setVoucherMsg(`Áp dụng thành công! Giảm ${formatPrice(d.discount_amount)}`)
      } else {
        setVoucherOk(false)
        setVoucherMsg(d.message || 'Mã không hợp lệ')
      }
    } catch {
      setVoucherOk(false)
      setVoucherMsg('Mã không hợp lệ hoặc đã hết hạn')
    }
    setApplying(false)
  }

  if (items.length === 0) return (
    <div className="container-page py-24 flex flex-col items-center text-center gap-5">
      <div className="h-24 w-24 bg-surface rounded-full flex items-center justify-center">
        <ShoppingBag className="h-10 w-10 text-text-muted" />
      </div>
      <div>
        <h1 className="font-display font-bold text-2xl">Giỏ hàng trống</h1>
        <p className="text-text-muted mt-2">Hãy thêm sản phẩm để bắt đầu mua sắm</p>
      </div>
      <Link href="/products" className="btn-primary btn-lg">Khám phá sản phẩm</Link>
    </div>
  )

  return (
    <div className="container-page py-7">
      <h1 className="font-display font-bold text-2xl mb-6">Giỏ hàng ({items.length} sản phẩm)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => (
            <div key={item.id} className="card p-4 flex gap-4">
              {/* Image */}
              <Link href={`/products/${item.product?.slug}`} className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-surface border border-border">
                <Image
                  src={item.product?.image ?? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=160'}
                  alt={item.product?.name ?? ''} fill className="object-cover" sizes="80px"
                />
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/products/${item.product?.slug}`}
                    className="text-sm font-semibold text-text-primary hover:text-primary line-clamp-2 leading-snug flex-1">
                    {item.product?.name}
                  </Link>
                  <button onClick={() => removeItem(item.id)}
                    className="p-1.5 text-text-muted hover:text-danger transition-colors shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {item.variant && (
                  <p className="text-xs text-text-muted mt-0.5">{item.variant.name}</p>
                )}

                <div className="flex items-center justify-between mt-3">
                  {/* Quantity */}
                  <div className="flex items-center border border-border rounded-lg overflow-hidden text-sm">
                    <button onClick={() => updateItem(item.id, item.quantity - 1)}
                      className="px-3 py-1.5 hover:bg-surface transition-colors">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-4 py-1.5 font-medium border-x border-border min-w-[2.5rem] text-center">
                      {item.quantity}
                    </span>
                    <button onClick={() => updateItem(item.id, item.quantity + 1)}
                      className="px-3 py-1.5 hover:bg-surface transition-colors">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-accent">{formatPrice(item.total_price)}</p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-text-muted">{formatPrice(item.unit_price)} / cái</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Voucher */}
          <div className="card p-4">
            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Tag className="h-4 w-4 text-primary" /> Mã giảm giá
            </label>
            <div className="flex gap-2">
              <input value={voucher} onChange={e => setVoucher(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && applyVoucher()}
                placeholder="Nhập mã voucher..." className="input-base flex-1 uppercase" />
              <button onClick={applyVoucher} disabled={applying}
                className="btn-primary shrink-0">
                {applying ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Áp dụng'}
              </button>
            </div>
            {voucherMsg && (
              <p className={cn('text-xs mt-2 font-medium', voucherOk ? 'text-success' : 'text-danger')}>
                {voucherMsg}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {['WELCOME50', 'SUMMER20', 'FREESHIP'].map(c => (
                <button key={c} onClick={() => setVoucher(c)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-primary/5 text-primary font-mono font-bold hover:bg-primary/10 transition-colors">
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-24 space-y-4">
            <h2 className="font-display font-bold text-lg">Tóm tắt đơn hàng</h2>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Tạm tính ({items.length} sản phẩm)</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Giảm giá</span>
                  <span className="font-semibold">-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-secondary">Phí vận chuyển</span>
                <span className={cn('font-medium', shipping === 0 ? 'text-success' : '')}>
                  {shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-text-muted">Miễn phí ship đơn từ {formatPrice(299000)}</p>
              )}
            </div>

            <div className="border-t border-border pt-4 flex justify-between items-center">
              <span className="font-bold">Tổng cộng</span>
              <span className="font-display font-black text-2xl text-danger">{formatPrice(total)}</span>
            </div>

            <Link href="/checkout" className="btn-accent w-full btn-lg flex items-center justify-center gap-2">
              Tiến hành thanh toán <ArrowRight className="h-4 w-4" />
            </Link>

            <Link href="/products" className="btn-ghost w-full text-center text-sm">
              ← Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
