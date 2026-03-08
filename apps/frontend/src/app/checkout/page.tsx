'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, MapPin, Truck, CreditCard, ChevronRight, Loader2 } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'
import { useAuthStore } from '@/stores/auth.store'
import { orderApi, userApi } from '@/lib/api'
import { cn, formatPrice } from '@/lib/utils'
import Link from 'next/link'

const PAYMENT_METHODS = [
  { value: 'vnpay',   label: 'VNPay',           sub: 'ATM / QR / Internet Banking', emoji: '🏦' },
  { value: 'momo',    label: 'Ví MoMo',          sub: 'Quét QR MoMo',                emoji: '💳' },
  { value: 'stripe',  label: 'Thẻ Visa/Master',  sub: 'Thanh toán quốc tế',          emoji: '💎' },
  { value: 'cod',     label: 'Tiền mặt (COD)',    sub: 'Trả khi nhận hàng',           emoji: '💵' },
]

const SHIP_PROVIDERS = [
  { value: 'ghn',         label: 'Giao Hàng Nhanh',  sub: 'Giao 1-2 ngày',  fee: 30000 },
  { value: 'ghtk',        label: 'Giao Hàng Tiết Kiệm', sub: 'Giao 2-3 ngày', fee: 15000 },
  { value: 'viettel_post',label: 'ViettelPost',      sub: 'Giao 3-5 ngày',  fee: 10000 },
]

const STEPS = [
  { id: 1, label: 'Địa chỉ',    icon: MapPin },
  { id: 2, label: 'Vận chuyển', icon: Truck },
  { id: 3, label: 'Thanh toán', icon: CreditCard },
]

export default function CheckoutPage() {
  const router  = useRouter()
  const { user } = useAuthStore()
  const { items, subtotal, clear } = useCartStore()

  const [step,      setStep]      = useState(1)
  const [addresses, setAddresses] = useState<any[]>([])
  const [addrId,    setAddrId]    = useState<string | null>(null)
  const [provider,  setProvider]  = useState('ghn')
  const [payment,   setPayment]   = useState('cod')
  const [note,      setNote]      = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  const selectedProvider = SHIP_PROVIDERS.find(p => p.value === provider)!
  const shipping = subtotal > 299000 ? 0 : selectedProvider.fee
  const total    = subtotal + shipping

  useEffect(() => {
    if (!user) { router.push('/login?redirect=/checkout'); return }
    userApi.addresses().then(res => {
      const list = res.data ?? []
      setAddresses(list)
      const def = list.find((a: any) => a.is_default) ?? list[0]
      if (def) setAddrId(def.id)
    }).catch(() => {})
  }, [user])

  const handlePlaceOrder = async () => {
    if (!addrId) { setError('Vui lòng chọn địa chỉ giao hàng'); return }
    setLoading(true); setError('')
    try {
      const res = await orderApi.create({
        address_id: addrId,
        payment_method: payment,
        shipping_provider: provider,
        note: note || undefined,
      })
      const orderId = res.data?.id
      clear()
      router.push(`/orders/${orderId}/success`)
    } catch (e: any) {
      setError(e.response?.data?.error?.message || 'Có lỗi xảy ra, vui lòng thử lại')
    } finally { setLoading(false) }
  }

  if (items.length === 0 && !loading) return (
    <div className="container-page py-24 text-center">
      <p className="font-bold text-xl">Giỏ hàng trống</p>
      <Link href="/products" className="btn-primary mt-5 inline-flex">Mua sắm ngay</Link>
    </div>
  )

  return (
    <div className="container-page py-7 max-w-5xl">
      <h1 className="font-display font-bold text-2xl mb-7">Thanh toán</h1>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className={cn('flex items-center gap-2.5 cursor-pointer', step >= s.id ? 'text-primary' : 'text-text-muted')}
              onClick={() => step > s.id && setStep(s.id)}>
              <div className={cn('h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                step > s.id  ? 'bg-success border-success text-white' :
                step === s.id ? 'border-primary bg-primary/5 text-primary' :
                'border-border text-text-muted')}>
                {step > s.id ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <span className={cn('text-sm font-semibold hidden sm:block', step === s.id && 'text-primary')}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-3 transition-colors', step > s.id ? 'bg-success' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">

          {/* Step 1: Address */}
          {step === 1 && (
            <div className="card p-5 animate-fade-in space-y-4">
              <h2 className="font-bold flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Địa chỉ giao hàng</h2>

              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-text-muted mb-4">Bạn chưa có địa chỉ nào</p>
                  <Link href="/account?tab=addresses" className="btn-outline">Thêm địa chỉ</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map(addr => (
                    <label key={addr.id}
                      className={cn('flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors',
                        addrId === addr.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30')}>
                      <input type="radio" name="address" value={addr.id}
                        checked={addrId === addr.id} onChange={() => setAddrId(addr.id)}
                        className="mt-0.5 accent-primary" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{addr.recipient_name}</p>
                          <span className="text-xs text-text-muted">{addr.recipient_phone}</span>
                          {addr.is_default && <span className="badge-primary text-[10px]">Mặc định</span>}
                        </div>
                        <p className="text-sm text-text-secondary mt-0.5">
                          {addr.street_address}, {addr.ward}, {addr.district}, {addr.province}
                        </p>
                        {addr.label && <p className="text-xs text-text-muted mt-0.5">📍 {addr.label}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <button onClick={() => setStep(2)} disabled={!addrId}
                className="btn-primary w-full gap-2 mt-2">
                Tiếp tục <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 2: Shipping */}
          {step === 2 && (
            <div className="card p-5 animate-fade-in space-y-4">
              <h2 className="font-bold flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> Phương thức vận chuyển</h2>

              <div className="space-y-3">
                {SHIP_PROVIDERS.map(p => (
                  <label key={p.value}
                    className={cn('flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors',
                      provider === p.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30')}>
                    <input type="radio" name="provider" value={p.value}
                      checked={provider === p.value} onChange={() => setProvider(p.value)}
                      className="accent-primary" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{p.label}</p>
                      <p className="text-xs text-text-muted">{p.sub}</p>
                    </div>
                    <span className="font-bold text-sm text-primary">
                      {subtotal > 299000 ? <span className="text-success">Miễn phí</span> : formatPrice(p.fee)}
                    </span>
                  </label>
                ))}
              </div>

              <div>
                <label className="text-sm font-medium text-text-secondary block mb-1.5">Ghi chú đơn hàng (tuỳ chọn)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)}
                  rows={3} placeholder="Nhập ghi chú cho shipper..."
                  className="input-base resize-none" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-outline flex-1">← Quay lại</button>
                <button onClick={() => setStep(3)} className="btn-primary flex-1 gap-2">
                  Tiếp tục <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="card p-5 animate-fade-in space-y-4">
              <h2 className="font-bold flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Phương thức thanh toán</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PAYMENT_METHODS.map(p => (
                  <label key={p.value}
                    className={cn('flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors',
                      payment === p.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30')}>
                    <input type="radio" name="payment" value={p.value}
                      checked={payment === p.value} onChange={() => setPayment(p.value)}
                      className="accent-primary" />
                    <span className="text-xl">{p.emoji}</span>
                    <div>
                      <p className="font-semibold text-sm">{p.label}</p>
                      <p className="text-xs text-text-muted">{p.sub}</p>
                    </div>
                  </label>
                ))}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-danger/20 rounded-xl text-sm text-danger">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-outline flex-1">← Quay lại</button>
                <button onClick={handlePlaceOrder} disabled={loading}
                  className="btn-accent flex-1 gap-2 text-base py-3.5">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang xử lý...</> : `Đặt hàng · ${formatPrice(total)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="card p-5 h-fit sticky top-24 space-y-4">
          <h2 className="font-bold">Đơn hàng ({items.length})</h2>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-text-muted shrink-0 w-5 text-center">{item.quantity}×</span>
                <p className="text-sm flex-1 line-clamp-2">{item.product?.name}</p>
                <p className="text-sm font-semibold shrink-0">{formatPrice(item.total_price)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 space-y-2 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Tạm tính</span><span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Vận chuyển</span>
              <span className={shipping === 0 ? 'text-success' : ''}>{shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
              <span>Tổng</span>
              <span className="text-danger font-display font-black text-xl">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
