'use client'
import { cn, discountPercent, formatPrice } from '@/lib/utils'
import { useCartStore } from '@/stores/cart.store'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

interface Product {
  id: string; name: string; slug: string
  basePrice: number; salePrice?: number | null
  avgRating: number; reviewCount: number; soldCount: number
  images?: { url: string; isPrimary: boolean }[]
  status?: string; brand?: { name: string }
  variants?: any[]
}

interface Props { product: Product; className?: string }

export function ProductCard({ product, className }: Props) {
  const addItem  = useCartStore(s => s.addItem)
  const loading  = useCartStore(s => s.loading)
  const [wished, setWished] = useState(false)
  const [adding, setAdding] = useState(false)

  const image = product.images?.find(i => i.isPrimary)?.url
    ?? product.images?.[0]?.url
    ?? `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80`

  const hasSale = product.salePrice && product.salePrice < product.basePrice
  const discount = hasSale ? discountPercent(product.basePrice, product.salePrice!) : 0

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    setAdding(true)
    try { await addItem(product.id, 1) } catch {}
    setAdding(false)
  }

  return (
    <Link href={`/products/${product.slug}`}
      className={cn('group relative flex flex-col bg-white rounded-2xl border border-border overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300', className)}>
      <div className="relative aspect-square overflow-hidden bg-surface">
        <Image src={image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width:640px) 50vw, 25vw" />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount > 0 && <span className="badge-sale">-{discount}%</span>}
          {product.status === 'out_of_stock' && <span className="badge bg-slate-200 text-slate-600">Hết hàng</span>}
        </div>
        <button onClick={e => { e.preventDefault(); setWished(w => !w) }}
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
          <Heart className={cn('h-4 w-4 transition-colors', wished ? 'fill-red-500 text-red-500' : 'text-slate-400')} />
        </button>
        <button onClick={handleAddToCart} disabled={adding || product.status === 'out_of_stock'}
          className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5 bg-primary text-white text-xs font-semibold py-2 rounded-xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 disabled:opacity-50">
          <ShoppingCart className="h-3.5 w-3.5" />
          {adding ? 'Đang thêm...' : 'Thêm vào giỏ'}
        </button>
      </div>
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        {product.brand && <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{product.brand.name}</p>}
        <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-2 flex-1">{product.name}</p>
        <div className="flex items-center gap-1.5">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={cn('h-3 w-3', i < Math.round(product.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200')} />
            ))}
          </div>
          <span className="text-xs text-slate-400">({product.reviewCount})</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="font-bold text-red-500 text-lg leading-none">{formatPrice(hasSale ? product.salePrice : product.basePrice)}</span>
          {hasSale && <span className="text-slate-400 text-sm line-through">{formatPrice(product.basePrice)}</span>}
        </div>
        {product.soldCount > 0 && <p className="text-xs text-slate-400">Đã bán {product.soldCount.toLocaleString('vi-VN')}</p>}
      </div>
    </Link>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-100 overflow-hidden">
      <div className="aspect-square bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-slate-100 rounded w-1/3" />
        <div className="h-4 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-2/3" />
        <div className="h-5 bg-slate-100 rounded w-1/2" />
      </div>
    </div>
  )
}
