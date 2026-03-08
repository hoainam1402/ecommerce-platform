'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, MapPin, Truck, CreditCard } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useCartStore } from '@/stores/cart.store'
import { userApi, orderApi, cartApi } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { cn, formatPrice } from '@/lib/utils'

const STEPS = [
  { id: 1, label: 'Địa chỉ giao hàng', icon: MapPin },
  { id: 2, label: 'Vận chuyển',         icon: Truck },
  { id: 3, label: 'Thanh toán',         icon: CreditCard },
]

const SHIPPING_PROVIDERS = [
  { value: 'ghn',          label: 'GHN — Giao nhanh',     days: '1-2 ngày', fee: 30_000 },
  { value: 'ghtk',         label: 'GHTK — Tiêu chuẩn',   days: '2-3 ngày', fee: 15_000 },
  { value: 'viettel_post', label: 'ViettelPost — Cơ bản', days: '3-5 ngày', fee: 10_000 },
]

const PAYMENT_METHODS = [
  { value: 'vnpay',   label: 'VNPay / ATM / QR',       logo: '🏦' },
  { value: 'momo',    label: 'Ví MoMo',                 logo: '🟣' },
  { value: 'zalopay', label: 'ZaloPay',                 logo: '🔵' },
  { value: 'stripe',  label: 'Thẻ Visa / Mastercard',  logo: '💳' },
  { value: 'cod',     label: 'Thanh toán khi nhận hàng', logo: '💵' },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, fetchCart } = useCartStore()

  const [step, setStep]                       = useState(1)
  const [selectedAddress, setSelectedAddress] = useState<string>('')
  const [provider, setProvider]               = useState('ghn')
  const [payment, setPayment]                 = useState('vnpay')
  const [note, setNote]                       = useState('')
  const [usePoints, setUsePoints]             = useState(false)
  const [loading, setLoading]                 = useState(false)

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn:  () => userApi.getAddresses(),
  })
  const addrList: any[] = Array.isArray(addresses) ? addresses : []

  // Auto-select default address
  if (addrList.length > 0 && !selectedAddress) {
    const def = addrList.find(a => a.isDefault) ?? addrList[0]
    setSelectedAddress(def.id)
  }

  const selectedProv = SHIPPING_PROVIDERS.find(p => p.value === provider)!
  const subtotal     = cart?.subtotal ?? 0
  const shippingFee  = subtotal >= 300_000 ? 0 : selectedProv.fee
  const total        = subtotal + shippingFee

  const placeOrder = async () => {
    if (!selectedAddress) return
    setLoading(true)
    try {
      const order: any = await orderApi.create({
        addressId:        selectedAddress,
        paymentMethod:    payment,
        shippingProvider: provider,
        pointsToUse:      usePoints ? undefined : 0,
        note,
      })

      await fetchCart()

      if (payment === 'cod') {
        router.push(`/orders/${order.id}/success`)
      } else {
        const payRes: any = await fetch(`/api/payments/${order.id}/initiate`, { method: 'POST' })
          .then(r => r.json())
        window.location.href = payRes.paymentUrl ?? `/orders/${order.id}/success`
      }
    } catch (err: any) {
      alert(err?.error?.message ?? 'Đặt hàng thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-page py-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center flex-1">
            <button
              onClick={() => step > s.id && setStep(s.id)}
              className={cn('flex items-center gap-2 group',
                step > s.id ? 'cursor-pointer' : 'cursor-default')}>
              <div className={cn(
                'h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors flex-shrink-0',
                step > s.id  ? 'bg-success text-white' :
                step === s.id ? 'bg-primary text-white' :
                'bg-border text-text-secondary',
              )}>
                {step > s.id ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <span className={cn('text-sm font-medium hidden sm:block',
                step === s.id ? 'text-primary' : step > s.id ? 'text-success' : 'text-text-secondary',
              )}>
                {s.label}
              </span>
            </button>
            {idx < STEPS.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-3',
                step > s.id ? 'bg-success' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Step content */}
        <div className="lg:col-span-2">

          {/* Step 1: Address */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-card p-5 space-y-4">
              <h2 className="font-semibold text-text-primary">Chọn địa chỉ giao hàng</h2>
              {addrList.length === 0 ? (
                <p className="text-sm text-text-secondary">Bạn chưa có địa chỉ. Vui lòng thêm địa chỉ mới.</p>
              ) : (
                <div className="space-y-3">
                  {addrList.map(addr => (
                    <label key={addr.id}
                      className={cn(
                        'flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors',
                        selectedAddress === addr.id ? 'border-primary bg-primary-50' : 'border-border hover:border-primary-light',
                      )}>
                      <input type="radio" name="address"
                        value={addr.id} checked={selectedAddress === addr.id}
                        onChange={() => setSelectedAddress(addr.id)}
                        className="mt-0.5 accent-primary" />
                      <div>
                        <p className="font-medium text-sm">
                          {addr.recipientName} — {addr.recipientPhone}
                          {addr.isDefault && <span className="ml-2 text-xs text-primary bg-primary-50 px-2 py-0.5 rounded-full">Mặc định</span>}
                        </p>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {addr.streetAddress}, {addr.ward}, {addr.district}, {addr.province}
                        </p>
                        {addr.label && <p className="text-xs text-text-secondary">{addr.label}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <Button variant="outline" size="sm">+ Thêm địa chỉ mới</Button>
              <div className="flex justify-end">
                <Button variant="primary" onClick={() => setStep(2)}
                  disabled={!selectedAddress}
                  rightIcon={<ChevronRight className="h-4 w-4" />}>
                  Tiếp tục
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Shipping */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-card p-5 space-y-4">
              <h2 className="font-semibold text-text-primary">Phương thức vận chuyển</h2>
              <div className="space-y-3">
                {SHIPPING_PROVIDERS.map(prov => (
                  <label key={prov.value}
                    className={cn(
                      'flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-colors',
                      provider === prov.value ? 'border-primary bg-primary-50' : 'border-border hover:border-primary-light',
                    )}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="provider" value={prov.value}
                        checked={provider === prov.value}
                        onChange={() => setProvider(prov.value)}
                        className="accent-primary" />
                      <div>
                        <p className="font-medium text-sm">{prov.label}</p>
                        <p className="text-xs text-text-secondary">{prov.days}</p>
                      </div>
                    </div>
                    <span className={cn('text-sm font-semibold',
                      subtotal >= 300_000 ? 'text-success' : 'text-text-primary')}>
                      {subtotal >= 300_000 ? 'Miễn phí' : formatPrice(prov.fee)}
                    </span>
                  </label>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Ghi chú đơn hàng (tùy chọn)</label>
                <textarea
                  value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Ghi chú cho người giao hàng..."
                  rows={3}
                  className="input-base resize-none"
                />
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>← Quay lại</Button>
                <Button variant="primary" onClick={() => setStep(3)}
                  rightIcon={<ChevronRight className="h-4 w-4" />}>Tiếp tục</Button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="bg-white rounded-2xl shadow-card p-5 space-y-4">
              <h2 className="font-semibold text-text-primary">Phương thức thanh toán</h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(pm => (
                  <label key={pm.value}
                    className={cn(
                      'flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors',
                      payment === pm.value ? 'border-primary bg-primary-50' : 'border-border hover:border-primary-light',
                    )}>
                    <input type="radio" name="payment" value={pm.value}
                      checked={payment === pm.value}
                      onChange={() => setPayment(pm.value)}
                      className="accent-primary" />
                    <span className="text-xl">{pm.logo}</span>
                    <span className="text-sm font-medium">{pm.label}</span>
                  </label>
                ))}
              </div>

              <label className="flex items-center gap-3 p-4 bg-surface rounded-xl cursor-pointer">
                <input type="checkbox" checked={usePoints}
                  onChange={e => setUsePoints(e.target.checked)}
                  className="h-4 w-4 accent-primary rounded" />
                <div>
                  <p className="text-sm font-medium">Sử dụng điểm thưởng</p>
                  <p className="text-xs text-text-secondary">500 điểm = 500.000đ</p>
                </div>
              </label>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>← Quay lại</Button>
                <Button variant="primary" size="lg"
                  loading={loading} onClick={placeOrder}
                  className="bg-accent hover:bg-red-700 px-8">
                  ĐẶT HÀNG
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="bg-white rounded-2xl shadow-card p-5 space-y-4 sticky top-20">
          <h3 className="font-semibold">Đơn hàng ({cart?.itemCount ?? 0})</h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {cart?.items.map(item => (
              <div key={item.id} className="flex gap-2 text-sm">
                <div className="relative h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-surface">
                  {/* Image would go here */}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="line-clamp-1 text-xs font-medium">{item.product.name}</p>
                  {item.variant && <p className="text-xs text-text-secondary">{item.variant.name}</p>}
                  <p className="text-xs">x{item.quantity}</p>
                </div>
                <span className="text-xs font-semibold flex-shrink-0">{formatPrice(item.totalPrice)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 text-sm border-t border-border pt-3">
            <div className="flex justify-between text-text-secondary">
              <span>Tạm tính</span><span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Vận chuyển</span>
              <span className={shippingFee === 0 ? 'text-success' : ''}>
                {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
              <span>Tổng cộng</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
