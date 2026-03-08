'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Package, Truck, MapPin, CreditCard, ArrowRight } from 'lucide-react'
import { orderApi } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'

export default function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>()

  const { data } = useQuery({
    queryKey: ['order', id],
    queryFn:  () => orderApi.detail(id),
    enabled:  !!id,
  })
  const order = data?.data

  return (
    <div className="container-page py-12 max-w-2xl">
      {/* Success header */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="inline-flex items-center justify-center h-20 w-20 bg-success/10 rounded-full mb-4">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
        <h1 className="font-display font-black text-3xl text-primary">Đặt hàng thành công!</h1>
        {order && (
          <p className="text-text-muted mt-2">
            Mã đơn hàng: <span className="font-mono font-bold text-primary">{order.order_number}</span>
          </p>
        )}
        <p className="text-text-secondary text-sm mt-2">Email xác nhận đã được gửi đến tài khoản của bạn</p>
      </div>

      {order && (
        <div className="card p-6 space-y-5 animate-slide-up">
          {/* Shipping */}
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Giao đến</p>
              <p className="text-sm text-text-secondary mt-0.5">
                {order.shipping_name} · {order.shipping_phone}
              </p>
              <p className="text-sm text-text-secondary">
                {order.shipping_address}, {order.shipping_ward}, {order.shipping_district}, {order.shipping_province}
              </p>
            </div>
          </div>

          {/* Payment */}
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
              <CreditCard className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Thanh toán</p>
              <p className="text-sm text-text-secondary mt-0.5 capitalize">
                {order.payment?.method?.toUpperCase() ?? 'COD'} ·
                <span className={order.payment?.status === 'paid' ? ' text-success font-medium' : ' text-warning font-medium'}>
                  {' '}{order.payment?.status === 'paid' ? 'Đã thanh toán ✓' : 'Thanh toán khi nhận'}
                </span>
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="border-t border-border pt-4">
            <p className="font-semibold text-sm mb-3">Sản phẩm ({order.items?.length ?? 0})</p>
            <div className="space-y-2.5">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="text-xs text-text-muted w-5 text-center shrink-0">{item.quantity}×</span>
                  <p className="text-sm flex-1 line-clamp-1">{item.product_name}</p>
                  <p className="text-sm font-semibold shrink-0">{formatPrice(item.total_price)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-border pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Tạm tính</span><span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Vận chuyển</span><span>{order.shipping_fee == 0 ? <span className="text-success">Miễn phí</span> : formatPrice(order.shipping_fee)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-success">
                <span>Giảm giá</span><span>-{formatPrice(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
              <span>Tổng cộng</span>
              <span className="text-danger font-display font-black text-xl">{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Link href="/account?tab=orders" className="btn-outline flex-1 gap-2 justify-center py-3">
          <Package className="h-4 w-4" /> Xem đơn hàng
        </Link>
        <Link href="/" className="btn-primary flex-1 gap-2 justify-center py-3">
          Tiếp tục mua sắm <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
