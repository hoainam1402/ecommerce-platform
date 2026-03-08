'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { cn, formatPrice, calcDiscountPct } from '@/lib/utils'
import { useCartStore } from '@/stores/cart.store'
import { useState } from 'react'

interface Product {
  id: string
  name: string
  slug: string
  basePrice: number
  salePrice?: number | null
  avgRating: number
  reviewCount: number
  soldCount: number
  status: string
  images?: { url: string; isPrimary: boolean }[]
  variants?: { id: string }[]
}

interface ProductCardProps {
  product: Product
  className?: string
  variant?: 'vertical' | 'horizontal' | 'mini'
}

export function ProductCard({ product, className, variant = 'vertical' }: ProductCardProps) {
  const { addItem, isLoading } = useCartStore()
  const [wishlisted, setWishlisted] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)

  const image = product.images?.find(i => i.isPrimary)?.url
    ?? product.images?.[0]?.url
    ?? '/placeholder-product.jpg'

  const discountPct = product.salePrice
    ? calcDiscountPct(product.basePrice, product.salePrice)
    : null

  const isOutOfStock = product.status === 'out_of_stock'
  const hasVariants  = (product.variants?.length ?? 0) > 0

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (hasVariants) return   // redirect ke PDP
    setAddingToCart(true)
    try {
      await addItem(product.id)
    } finally {
      setAddingToCart(false)
    }
  }

  if (variant === 'mini') {
    return (
      <Link href={`/products/${product.slug}`}
        className={cn('flex gap-3 p-2 hover:bg-surface rounded-lg transition-colors', className)}>
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-surface">
          <Image src={image} alt={product.name} fill className="object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium line-clamp-2 text-text-primary">{product.name}</p>
          <p className="text-sm font-bold text-primary mt-0.5">
            {formatPrice(product.salePrice ?? product.basePrice)}
          </p>
        </div>
      </Link>
    )
  }

  if (variant === 'horizontal') {
    return (
      <Link href={`/products/${product.slug}`}
        className={cn('flex gap-4 p-4 bg-white rounded-card shadow-card hover:shadow-card-hover transition-shadow group', className)}>
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-surface">
          <Image src={image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          {discountPct && (
            <span className="absolute top-1 left-1 bg-accent text-white text-xs font-bold px-1.5 py-0.5 rounded">
              -{discountPct}%
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary line-clamp-2 text-sm">{product.name}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="text-xs text-text-secondary">{product.avgRating.toFixed(1)} ({product.reviewCount})</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-bold text-primary">{formatPrice(product.salePrice ?? product.basePrice)}</span>
            {product.salePrice && (
              <span className="text-xs line-through text-text-secondary">{formatPrice(product.basePrice)}</span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  // Vertical (default)
  return (
    <Link href={`/products/${product.slug}`}
      className={cn('group relative bg-white rounded-card shadow-card hover:shadow-card-hover transition-all duration-300', className)}>

      {/* Image */}
      <div className="relative overflow-hidden rounded-t-card aspect-square bg-surface">
        <Image
          src={image} alt={product.name} fill
          className={cn('object-cover transition-transform duration-500 group-hover:scale-105',
            isOutOfStock && 'opacity-60')}
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discountPct && (
            <span className="bg-accent text-white text-xs font-bold px-2 py-1 rounded-md">
              -{discountPct}%
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-text-secondary text-white text-xs font-bold px-2 py-1 rounded-md">
              Hết hàng
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); setWishlisted(w => !w) }}
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
        >
          <Heart className={cn('h-4 w-4 transition-colors',
            wishlisted ? 'fill-accent text-accent' : 'text-text-secondary')} />
        </button>

        {/* Quick add */}
        {!isOutOfStock && !hasVariants && (
          <button
            onClick={handleAddToCart}
            disabled={addingToCart}
            className="absolute bottom-0 left-0 right-0 bg-primary text-white text-sm font-semibold py-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            {addingToCart ? 'Đang thêm...' : 'Thêm vào giỏ'}
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-text-primary line-clamp-2 leading-snug min-h-[2.5rem]">
          {product.name}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1.5">
          <div className="flex">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className={cn('h-3 w-3',
                i <= Math.round(product.avgRating)
                  ? 'fill-warning text-warning'
                  : 'fill-border text-border')} />
            ))}
          </div>
          <span className="text-xs text-text-secondary">({product.reviewCount})</span>
          {product.soldCount > 0 && (
            <span className="text-xs text-text-secondary ml-auto">Đã bán {product.soldCount}</span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-price text-primary">
            {formatPrice(product.salePrice ?? product.basePrice)}
          </span>
          {product.salePrice && (
            <span className="text-price-sm line-through text-text-secondary">
              {formatPrice(product.basePrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
