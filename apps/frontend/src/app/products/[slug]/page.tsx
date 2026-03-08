'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Star, Heart, ShoppingCart, Zap, Truck, RefreshCw, Shield,
  ChevronLeft, ChevronRight, ZoomIn, Minus, Plus, Share2,
} from 'lucide-react'
import { productApi } from '@/lib/api'
import { useCartStore } from '@/stores/cart.store'
import { Button } from '@/components/ui/Button'
import { ProductCard } from '@/components/ui/ProductCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn, formatPrice, calcDiscountPct } from '@/lib/utils'

function RatingStars({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={cn(
          size === 'sm' ? 'h-3 w-3' : 'h-4 w-4',
          i <= Math.round(rating) ? 'fill-warning text-warning' : 'fill-border text-border',
        )} />
      ))}
    </div>
  )
}

export default function PDPPage() {
  const { slug } = useParams<{ slug: string }>()
  const { addItem } = useCartStore()

  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [quantity, setQuantity]               = useState(1)
  const [activeImage, setActiveImage]         = useState(0)
  const [activeTab, setActiveTab]             = useState<'desc' | 'specs' | 'reviews' | 'qa'>('desc')
  const [wishlisted, setWishlisted]           = useState(false)
  const [addingToCart, setAddingToCart]       = useState(false)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn:  () => productApi.detail(slug),
    enabled:  !!slug,
  })

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', slug],
    queryFn:  () => productApi.reviews(slug),
    enabled:  !!slug && activeTab === 'reviews',
  })

  if (isLoading) {
    return (
      <div className="container-page py-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="flex gap-2">{Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-16 w-16 rounded-lg" />)}</div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) return null
  const p = product as any

  const images   = p.images ?? []
  const variants = p.variants ?? []
  const currentVariant = variants.find((v: any) => v.id === selectedVariant)
  const price    = currentVariant?.salePrice ?? currentVariant?.price ?? p.salePrice ?? p.basePrice
  const baseP    = currentVariant?.price ?? p.basePrice
  const discPct  = price < baseP ? calcDiscountPct(baseP, price) : null
  const inStock  = p.status !== 'out_of_stock' && (currentVariant?.stockQuantity ?? 1) > 0

  const handleAddToCart = async (buyNow = false) => {
    if (!inStock) return
    setAddingToCart(true)
    try {
      await addItem(p.id, selectedVariant ?? undefined, quantity)
      if (buyNow) window.location.href = '/checkout'
    } finally {
      setAddingToCart(false)
    }
  }

  const TABS = [
    { key: 'desc',    label: 'Mô tả' },
    { key: 'specs',   label: 'Thông số' },
    { key: 'reviews', label: `Đánh giá (${p.reviewCount ?? 0})` },
    { key: 'qa',      label: 'Hỏi & Đáp' },
  ] as const

  return (
    <div className="container-page py-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-text-secondary mb-4 flex items-center gap-1.5 flex-wrap">
        <a href="/" className="hover:text-primary">Trang chủ</a>
        {p.categories?.[0] && (<><span>/</span><a href={`/categories/${p.categories[0].slug}`} className="hover:text-primary">{p.categories[0].name}</a></>)}
        <span>/</span>
        <span className="text-text-primary font-medium line-clamp-1">{p.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* LEFT — Gallery */}
        <div className="space-y-3">
          {/* Main image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface group cursor-zoom-in">
            <Image
              src={images[activeImage]?.url ?? '/placeholder-product.jpg'}
              alt={p.name} fill className="object-contain p-4"
            />
            {discPct && (
              <span className="absolute top-4 left-4 badge-sale text-base px-3 py-1">-{discPct}%</span>
            )}
            <button className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="h-4 w-4 text-text-secondary" />
            </button>
            {images.length > 1 && (
              <>
                <button onClick={() => setActiveImage(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 shadow flex items-center justify-center">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setActiveImage(i => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 shadow flex items-center justify-center">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {images.map((img: any, i: number) => (
                <button key={i} onClick={() => setActiveImage(i)}
                  className={cn('h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors',
                    i === activeImage ? 'border-primary' : 'border-border hover:border-primary-light')}>
                  <Image src={img.url} alt="" width={64} height={64} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — Info */}
        <div className="space-y-4">
          {p.brand && <p className="text-sm text-primary font-medium">{p.brand.name}</p>}
          <h1 className="font-display font-bold text-2xl text-text-primary leading-snug">{p.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-3 text-sm">
            <RatingStars rating={p.avgRating ?? 0} />
            <span className="font-medium">{(p.avgRating ?? 0).toFixed(1)}</span>
            <span className="text-text-secondary">({p.reviewCount ?? 0} đánh giá)</span>
            {p.soldCount > 0 && <span className="text-text-secondary">• Đã bán {p.soldCount}</span>}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-primary">{formatPrice(price)}</span>
            {discPct && (
              <>
                <span className="text-lg line-through text-text-secondary">{formatPrice(baseP)}</span>
                <span className="badge-sale">-{discPct}%</span>
              </>
            )}
          </div>

          {/* Variants */}
          {variants.length > 0 && (
            <div className="space-y-3">
              {/* Group by attribute type */}
              {(() => {
                const attrKeys = [...new Set(variants.flatMap((v: any) => Object.keys(v.attributes ?? {})))]
                return attrKeys.map((attr: string) => {
                  const options = [...new Set(variants.map((v: any) => v.attributes?.[attr]))]
                  return (
                    <div key={attr}>
                      <p className="text-sm font-medium mb-2 capitalize">{attr}:</p>
                      <div className="flex flex-wrap gap-2">
                        {options.map((opt: any) => {
                          const variantForOpt = variants.find((v: any) => v.attributes?.[attr] === opt)
                          const outOfStock = variantForOpt?.stockQuantity === 0
                          const isSelected = currentVariant?.attributes?.[attr] === opt
                          return (
                            <button key={opt}
                              onClick={() => !outOfStock && setSelectedVariant(variantForOpt?.id)}
                              disabled={outOfStock}
                              className={cn(
                                'px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all',
                                isSelected
                                  ? 'border-primary bg-primary-50 text-primary'
                                  : 'border-border hover:border-primary-light text-text-primary',
                                outOfStock && 'opacity-40 cursor-not-allowed line-through',
                              )}>
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium">Số lượng:</p>
            <div className="flex items-center border-2 border-border rounded-xl overflow-hidden">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="h-10 w-10 flex items-center justify-center hover:bg-surface disabled:opacity-40 transition-colors">
                <Minus className="h-4 w-4" />
              </button>
              <span className="h-10 w-12 flex items-center justify-center text-sm font-bold border-x-2 border-border">
                {quantity}
              </span>
              <button onClick={() => setQuantity(q => q + 1)}
                className="h-10 w-10 flex items-center justify-center hover:bg-surface transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {currentVariant && (
              <span className="text-sm text-text-secondary">
                Còn {currentVariant.stockQuantity} sản phẩm
              </span>
            )}
          </div>

          {/* CTA buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="lg"
              onClick={() => handleAddToCart(false)}
              loading={addingToCart}
              disabled={!inStock}
              leftIcon={<ShoppingCart className="h-5 w-5" />}>
              {inStock ? 'Thêm vào giỏ' : 'Hết hàng'}
            </Button>
            <Button variant="primary" size="lg"
              onClick={() => handleAddToCart(true)}
              disabled={!inStock}
              leftIcon={<Zap className="h-5 w-5 fill-white" />}>
              Mua ngay
            </Button>
          </div>

          {/* Wishlist + Share */}
          <div className="flex items-center gap-3 text-sm">
            <button onClick={() => setWishlisted(w => !w)}
              className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors">
              <Heart className={cn('h-4 w-4', wishlisted && 'fill-accent text-accent')} />
              {wishlisted ? 'Đã thêm vào yêu thích' : 'Thêm vào yêu thích'}
            </button>
            <span className="text-border">|</span>
            <button className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
              <Share2 className="h-4 w-4" /> Chia sẻ
            </button>
          </div>

          {/* Policies */}
          <div className="bg-surface rounded-xl p-4 space-y-2.5">
            {[
              { icon: Truck,    text: 'Miễn phí vận chuyển đơn từ 300.000đ' },
              { icon: RefreshCw, text: 'Đổi trả trong 30 ngày nếu lỗi nhà sản xuất' },
              { icon: Shield,   text: 'Bảo hành chính hãng 12 tháng' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-text-secondary">
                <Icon className="h-4 w-4 text-success flex-shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12 border-b border-border">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-shrink-0 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary',
              )}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="py-8 max-w-3xl">
        {activeTab === 'desc' && (
          <div className="prose prose-sm max-w-none text-text-primary"
            dangerouslySetInnerHTML={{ __html: p.description ?? '<p>Chưa có mô tả.</p>' }} />
        )}

        {activeTab === 'specs' && (
          <div className="space-y-1">
            {Object.entries(p.attributes ?? {}).map(([k, v]) => (
              <div key={k} className="grid grid-cols-2 gap-4 py-2.5 border-b border-border text-sm">
                <span className="text-text-secondary capitalize">{k}</span>
                <span className="font-medium text-text-primary">{String(v)}</span>
              </div>
            ))}
            {!p.attributes && <p className="text-text-secondary text-sm">Chưa có thông số.</p>}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="flex items-center gap-6 p-6 bg-surface rounded-xl">
              <div className="text-center">
                <p className="text-5xl font-black text-primary">{(p.avgRating ?? 0).toFixed(1)}</p>
                <RatingStars rating={p.avgRating ?? 0} />
                <p className="text-xs text-text-secondary mt-1">{p.reviewCount ?? 0} đánh giá</p>
              </div>
            </div>
            {(reviewsData as any)?.items?.map((r: any) => (
              <div key={r.id} className="border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <RatingStars rating={r.rating} size="sm" />
                  <span className="text-sm font-medium">{r.user?.fullName ?? 'Ẩn danh'}</span>
                  {r.isVerifiedPurchase && (
                    <span className="text-xs text-success bg-green-50 px-2 py-0.5 rounded-full">✓ Đã mua hàng</span>
                  )}
                </div>
                {r.title && <p className="font-medium text-sm">{r.title}</p>}
                <p className="text-sm text-text-secondary">{r.content}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'qa' && (
          <p className="text-text-secondary text-sm">Chưa có câu hỏi nào. Hãy là người đặt câu hỏi đầu tiên!</p>
        )}
      </div>
    </div>
  )
}
