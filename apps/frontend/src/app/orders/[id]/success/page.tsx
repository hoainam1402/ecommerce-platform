'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle, Package, MapPin, CreditCard, ArrowRight } from 'lucide-react'
import { orderApi } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { formatPrice, formatDate } from '@/lib/utils'

export default function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>()
  const { data: order } = useQuery({
    queryKey: ['order', id],
    queryFn:  () => orderApi.detail(id),
    enabled:  !!id,
  })
  const o = order as any

  return (
    <div className="container-page py-12 max-w-2xl">
      {/* Success state */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="h-20 w-20 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-success" strokeWidth={1.5} />
          </div>
        </div>
        <h1 className="font-display font-black text-3xl text-text-primary">Đặt hàng thành công!</h1>
        {o && (
          <>
            <p className="text-text-secondary mt-2 text-sm">
              Mã đơn hàng: <span className="font-mono font-bold text-text-primary">{o.orderNumber}</span>
            </p>
            <p className="text-text-secondary text-xs mt-1">
              Email xác nhận đã gửi đến: <span className="font-medium">{o.user?.email}</span>
            </p>
          </>
        )}
      </div>

      {/* Order summary card */}
      {o && (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-6">
          <div className="px-5 py-4 bg-surface border-b border-border">
            <h2 className="font-semibold text-text-primary">Tóm tắt đơn hàng</h2>
          </div>

          {/* Shipping info */}
          <div className="px-5 py-4 border-b border-border space-y-2">
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-text-secondary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">{o.shippingName} — {o.shippingPhone}</p>
                <p className="text-xs text-text-secondary">
                  {o.shippingAddress}, {o.shippingWard}, {o.shippingDistrict}, {o.shippingProvince}
                </p>
              </div>
            </div>
            {o.shipment?.estimatedDelivery && (
              <div className="flex items-center gap-2.5">
                <Package className="h-4 w-4 text-text-secondary flex-shrink-0" />
                <p className="text-sm text-text-secondary">
                  Dự kiến giao: <span className="font-medium text-text-primary">{formatDate(o.shipment.estimatedDelivery)}</span>
                  {o.shipment.provider && ` (${o.shipment.provider.toUpperCase()})`}
                </p>
              </div>
            )}
            {o.payment && (
              <div className="flex items-center gap-2.5">
                <CreditCard className="h-4 w-4 text-text-secondary flex-shrink-0" />
                <p className="text-sm text-text-secondary">
                  Thanh toán: <span className="font-medium text-text-primary">{o.payment.method?.toUpperCase()}</span>
                  {o.payment.status === 'paid' && (
                    <span className="ml-2 text-success text-xs font-medium">✓ ĐÃ THANH TOÁN</span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="px-5 py-4 space-y-3">
            {o.items?.slice(0, 3).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium line-clamp-1">{item.productName}</p>
                  {item.variantName && <p className="text-xs text-text-secondary">{item.variantName}</p>}
                  <p className="text-xs text-text-secondary">x{item.quantity}</p>
                </div>
                <span className="font-semibold flex-shrink-0">{formatPrice(item.totalPrice)}</span>
              </div>
            ))}
            {o.items?.length > 3 && (
              <p className="text-xs text-text-secondary">+{o.items.length - 3} sản phẩm khác...</p>
            )}
          </div>

          {/* Total */}
          <div className="px-5 py-4 bg-surface border-t border-border space-y-1.5 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Tạm tính</span><span>{formatPrice(o.subtotal)}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Vận chuyển</span><span>{formatPrice(o.shippingFee)}</span>
            </div>
            {o.discountAmount > 0 && (
              <div className="flex justify-between text-success">
                <span>Giảm giá</span><span>-{formatPrice(o.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
              <span>Tổng cộng</span>
              <span className="text-primary">{formatPrice(o.totalAmount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" size="lg" className="flex-1">
          <Link href={`/account/orders`} className="flex items-center gap-2 justify-center w-full">
            <Package className="h-4 w-4" /> Xem chi tiết đơn hàng
          </Link>
        </Button>
        <Button variant="primary" size="lg" className="flex-1"
          rightIcon={<ArrowRight className="h-4 w-4" />}>
          <Link href="/" className="flex items-center gap-2 justify-center w-full">
            Tiếp tục mua sắm
          </Link>
        </Button>
      </div>
    </div>
  )
}
