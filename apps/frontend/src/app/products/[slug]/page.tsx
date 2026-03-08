'use client'
import { productApi } from '@/lib/api'
import { cn, discountPercent, formatPrice } from '@/lib/utils'
import { useCartStore } from '@/stores/cart.store'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Heart, Minus, Plus, RotateCcw, Shield, ShoppingCart, Star, Truck, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn:  () => productApi.detail(slug),
  })
  const product = data?.data

  const [mainImg,   setMainImg]   = useState(0)
  const [variantId, setVariantId] = useState<string | null>(null)
  const [qty,       setQty]       = useState(1)
  const [wished,    setWished]    = useState(false)
  const [activeTab, setActiveTab] = useState<'desc'|'specs'|'reviews'>('desc')

  const { addItem, loading: cartLoading } = useCartStore()

  const selectedVariant = product?.variants?.find((v: any) => v.id === variantId)
    ?? product?.variants?.[0]

  const price     = parseFloat(String(selectedVariant?.salePrice ?? selectedVariant?.price ?? product?.salePrice ?? product?.basePrice ?? 0))
  const origPrice = parseFloat(String(selectedVariant?.price ?? product?.basePrice ?? 0))
  const hasDiscount = price && origPrice && price < origPrice
  const discount    = hasDiscount ? discountPercent(parseFloat(origPrice), parseFloat(price)) : 0

  const images = product?.images ?? []

  const handleAddToCart = async () => {
    await addItem(product.id, qty, selectedVariant?.id)
  }

  if (isLoading) return (
    <div className="container-page py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="aspect-square skeleton rounded-2xl" />
        <div className="space-y-4">
          <div className="h-6 skeleton w-1/3" />
          <div className="h-8 skeleton w-full" />
          <div className="h-4 skeleton w-1/2" />
          <div className="h-10 skeleton w-1/3" />
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="container-page py-24 text-center">
      <p className="text-5xl mb-4">😕</p>
      <p className="font-bold text-xl">Không tìm thấy sản phẩm</p>
      <Link href="/products" className="btn-primary mt-6 inline-flex">Quay lại</Link>
    </div>
  )

  return (
    <div className="container-page py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-text-muted mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/products" className="hover:text-primary transition-colors">Sản phẩm</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-text-primary font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-14">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface border border-border">
            <Image
              src={images[mainImg]?.url ?? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'}
              alt={product.name} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {discount > 0 && (
              <span className="absolute top-4 left-4 badge-sale text-sm px-3 py-1">-{discount}%</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {images.map((img: any, i: number) => (
                <button key={i} onClick={() => setMainImg(i)}
                  className={cn('relative shrink-0 h-16 w-16 rounded-xl overflow-hidden border-2 transition-colors',
                    i === mainImg ? 'border-primary' : 'border-transparent hover:border-border')}>
                  <Image src={img.url} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          {product.brand && (
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{product.brand.name}</p>
          )}

          <h1 className="font-display font-bold text-2xl md:text-3xl text-text-primary leading-tight">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn('h-4 w-4', i < Math.round(product.avgRating ?? 0) ? 'fill-warning text-warning' : 'text-border')} />
              ))}
              <span className="font-bold text-sm ml-1">{parseFloat(String(product.avgRating || 0)).toFixed(1)}</span>
            </div>
            <span className="text-text-muted text-sm">({product.reviewCount} đánh giá)</span>
            {product.soldCount > 0 && (
              <span className="text-text-muted text-sm">• Đã bán {product.soldCount?.toLocaleString('vi-VN')}</span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-end gap-3 py-3 border-y border-border">
            <span className="font-display font-black text-4xl text-danger">{formatPrice(price)}</span>
            {hasDiscount && <span className="text-text-muted line-through text-lg">{formatPrice(origPrice)}</span>}
          </div>

          {/* Variants */}
          {product.variants?.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-text-primary">
                Phiên bản: <span className="font-normal text-text-secondary">{selectedVariant?.name}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: any) => (
                  <button key={v.id} onClick={() => setVariantId(v.id)}
                    disabled={v.stock_quantity === 0}
                    className={cn(
                      'px-3.5 py-2 rounded-xl text-sm font-medium border-2 transition-all',
                      v.id === (variantId ?? product.variants[0]?.id)
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/50 text-text-secondary',
                      v.stock_quantity === 0 && 'opacity-40 line-through cursor-not-allowed'
                    )}>
                    {v.name}
                  </button>
                ))}
              </div>
              {selectedVariant && (
                <p className="text-xs text-text-muted">
                  Còn lại: <span className={cn('font-semibold', selectedVariant.stock_quantity > 0 ? 'text-success' : 'text-danger')}>
                    {selectedVariant.stock_quantity > 0 ? `${selectedVariant.stock_quantity} sản phẩm` : 'Hết hàng'}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <div className="flex items-center border-2 border-border rounded-xl overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}
                className="px-4 py-3 hover:bg-surface transition-colors">
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-5 py-3 font-bold text-base min-w-[3.5rem] text-center border-x-2 border-border">{qty}</span>
              <button onClick={() => setQty(q => q + 1)}
                className="px-4 py-3 hover:bg-surface transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-text-muted">Tối đa 10 sản phẩm</p>
          </div>

          {/* CTA */}
          <div className="flex gap-3">
            <button onClick={handleAddToCart} disabled={cartLoading}
              className="btn-outline flex-1 gap-2 py-3.5">
              <ShoppingCart className="h-4 w-4" />
              {cartLoading ? 'Đang thêm...' : 'Thêm vào giỏ'}
            </button>
            <button onClick={handleAddToCart} disabled={cartLoading}
              className="btn-accent flex-1 gap-2 py-3.5">
              <Zap className="h-4 w-4 fill-white" />
              Mua ngay
            </button>
            <button onClick={() => setWished(w => !w)}
              className={cn('btn-outline px-4 py-3.5', wished && 'border-danger text-danger bg-red-50')}>
              <Heart className={cn('h-4 w-4', wished && 'fill-danger')} />
            </button>
          </div>

          {/* Perks */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: Truck,      label: 'Miễn phí ship', sub: 'Đơn từ 299K' },
              { icon: RotateCcw,  label: 'Đổi trả 30 ngày', sub: 'Dễ dàng' },
              { icon: Shield,     label: 'Bảo hành', sub: 'Chính hãng' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center text-center p-3 rounded-xl bg-surface">
                <Icon className="h-5 w-5 text-primary mb-1.5" />
                <p className="text-xs font-semibold text-text-primary">{label}</p>
                <p className="text-xs text-text-muted">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="flex border-b border-border gap-1">
          {[
            { key: 'desc',    label: 'Mô tả sản phẩm' },
            { key: 'specs',   label: 'Thông số kỹ thuật' },
            { key: 'reviews', label: `Đánh giá (${product.review_count ?? 0})` },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={cn('px-5 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-primary')}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="py-6">
          {activeTab === 'desc' && (
            <div className="prose prose-sm max-w-none text-text-secondary leading-relaxed"
              dangerouslySetInnerHTML={{ __html: product.description || product.short_description || 'Chưa có mô tả.' }} />
          )}
          {activeTab === 'specs' && (
            <div className="max-w-lg">
              {product.attributes && typeof product.attributes === 'object'
                ? Object.entries(product.attributes).map(([k, v]) => (
                    <div key={k} className="flex py-2.5 border-b border-border last:border-0">
                      <span className="w-1/2 text-sm text-text-muted">{k}</span>
                      <span className="w-1/2 text-sm font-medium">{String(v)}</span>
                    </div>
                  ))
                : <p className="text-text-muted text-sm">Chưa có thông số.</p>
              }
            </div>
          )}
          {activeTab === 'reviews' && (
            <div className="max-w-2xl">
              <div className="flex items-center gap-6 p-5 bg-surface rounded-2xl mb-6">
                <div className="text-center">
                  <p className="font-display font-black text-5xl text-primary">{product.avg_rating?.toFixed(1)}</p>
                  <div className="flex justify-center mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn('h-4 w-4', i < Math.round(product.avg_rating ?? 0) ? 'fill-warning text-warning' : 'text-border')} />
                    ))}
                  </div>
                  <p className="text-xs text-text-muted mt-1">{product.review_count} đánh giá</p>
                </div>
              </div>
              <p className="text-text-muted text-sm">Đăng nhập để xem và viết đánh giá.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
