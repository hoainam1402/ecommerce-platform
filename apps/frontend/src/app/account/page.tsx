'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Package, Heart, MapPin, Bell, Star, Lock, LogOut,
  ChevronRight, Clock, CheckCircle, XCircle, Truck,
} from 'lucide-react'
import { orderApi } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/Button'
import { cn, formatPrice, formatDate } from '@/lib/utils'

const ORDER_TABS = [
  { key: '',                  label: 'Tất cả' },
  { key: 'pending,confirmed', label: 'Chờ xử lý' },
  { key: 'shipped',           label: 'Đang giao' },
  { key: 'delivered',         label: 'Đã giao' },
  { key: 'cancelled',         label: 'Đã hủy' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:          { label: 'Chờ xác nhận', color: 'text-warning bg-orange-50',  icon: Clock },
  confirmed:        { label: 'Đã xác nhận',  color: 'text-primary bg-primary-50', icon: CheckCircle },
  processing:       { label: 'Đang xử lý',   color: 'text-primary bg-primary-50', icon: Clock },
  packed:           { label: 'Đã đóng gói',  color: 'text-primary bg-primary-50', icon: Package },
  shipped:          { label: 'Đang giao',     color: 'text-warning bg-orange-50',  icon: Truck },
  delivered:        { label: 'Đã giao',       color: 'text-success bg-green-50',   icon: CheckCircle },
  cancelled:        { label: 'Đã hủy',        color: 'text-accent bg-red-50',      icon: XCircle },
  refund_requested: { label: 'Yêu cầu hoàn', color: 'text-accent bg-red-50',      icon: Clock },
  refunded:         { label: 'Đã hoàn tiền',  color: 'text-success bg-green-50',  icon: CheckCircle },
}

const TIER_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  bronze:   { label: 'Bronze',   color: 'text-amber-700  bg-amber-50',  emoji: '🥉' },
  silver:   { label: 'Silver',   color: 'text-slate-600  bg-slate-100', emoji: '🥈' },
  gold:     { label: 'Gold',     color: 'text-yellow-600 bg-yellow-50', emoji: '🥇' },
  platinum: { label: 'Platinum', color: 'text-cyan-600   bg-cyan-50',   emoji: '💎' },
}

const NAV_ITEMS = [
  { key: 'orders',      label: 'Đơn hàng của tôi', icon: Package },
  { key: 'wishlist',    label: 'Danh sách yêu thích', icon: Heart },
  { key: 'addresses',   label: 'Sổ địa chỉ',        icon: MapPin },
  { key: 'notifications', label: 'Thông báo',        icon: Bell },
  { key: 'loyalty',     label: 'Điểm & Ưu đãi',     icon: Star },
  { key: 'security',    label: 'Bảo mật',            icon: Lock },
]

export default function AccountPage() {
  const router  = useRouter()
  const { user, logout } = useAuthStore()
  const [activeNav, setActiveNav]   = useState('orders')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn:  () => orderApi.list({ status: statusFilter || undefined, limit: 20 }),
    enabled:  !!user,
  })

  if (!user) {
    router.push('/login')
    return null
  }

  const orders: any[] = Array.isArray(ordersData)
    ? ordersData
    : (ordersData as any)?.items ?? []

  const tier = TIER_CONFIG[user.loyaltyTier ?? 'bronze']

  return (
    <div className="container-page py-6">
      <div className="grid lg:grid-cols-4 gap-6 items-start">
        {/* Sidebar */}
        <aside className="bg-white rounded-2xl shadow-card overflow-hidden">
          {/* User info */}
          <div className="p-5 bg-gradient-to-br from-primary-600 to-primary text-white">
            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black mb-3">
              {user.fullName?.charAt(0).toUpperCase()}
            </div>
            <p className="font-bold text-lg leading-tight">{user.fullName}</p>
            <p className="text-primary-100 text-xs mt-0.5">{user.email}</p>
            <div className={cn('inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-full text-xs font-bold', tier.color)}>
              {tier.emoji} {tier.label}
            </div>
          </div>

          {/* Nav */}
          <nav className="py-2">
            {NAV_ITEMS.map(item => (
              <button key={item.key}
                onClick={() => setActiveNav(item.key)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                  activeNav === item.key
                    ? 'bg-primary-50 text-primary font-medium'
                    : 'text-text-secondary hover:bg-surface hover:text-text-primary',
                )}>
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronRight className="h-3.5 w-3.5 opacity-40" />
              </button>
            ))}
            <button
              onClick={() => { logout(); router.push('/') }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-accent hover:bg-red-50 transition-colors">
              <LogOut className="h-4 w-4 flex-shrink-0" />
              Đăng xuất
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeNav === 'orders' && (
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-semibold text-lg">Đơn hàng của tôi</h2>
              </div>

              {/* Order status tabs */}
              <div className="flex overflow-x-auto scrollbar-hide border-b border-border">
                {ORDER_TABS.map(tab => (
                  <button key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={cn(
                      'flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                      statusFilter === tab.key
                        ? 'border-primary text-primary'
                        : 'border-transparent text-text-secondary hover:text-text-primary',
                    )}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Order list */}
              {isLoading ? (
                <div className="p-8 text-center text-text-secondary text-sm">Đang tải...</div>
              ) : orders.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="h-12 w-12 text-border mx-auto mb-3" />
                  <p className="text-text-secondary text-sm">Chưa có đơn hàng nào</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    <Link href="/products">Mua sắm ngay</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {orders.map((order: any) => {
                    const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
                    const StatusIcon = statusCfg.icon
                    return (
                      <div key={order.id} className="p-4 hover:bg-surface/50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-sm font-medium">{order.orderNumber}</p>
                            <p className="text-xs text-text-secondary mt-0.5">{formatDate(order.createdAt)}</p>
                          </div>
                          <span className={cn('flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', statusCfg.color)}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusCfg.label}
                          </span>
                        </div>

                        {/* Items preview */}
                        <div className="mt-2 text-xs text-text-secondary">
                          {order.items?.slice(0, 2).map((item: any) => (
                            <span key={item.id}>{item.productName} x{item.quantity}; </span>
                          ))}
                          {order.items?.length > 2 && <span>+{order.items.length - 2} sản phẩm...</span>}
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <p className="text-sm font-bold text-primary">{formatPrice(order.totalAmount)}</p>
                          <div className="flex items-center gap-2">
                            {order.status === 'delivered' && (
                              <Button variant="outline" size="sm" className="text-xs h-8">
                                Đánh giá ngay
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="text-xs h-8">
                              <Link href={`/account/orders/${order.id}`}>Xem chi tiết</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeNav !== 'orders' && (
            <div className="bg-white rounded-2xl shadow-card p-8 text-center text-text-secondary">
              <p className="text-sm">Tính năng đang phát triển...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
