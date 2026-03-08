'use client'
import Link from 'next/link'
import { UseQueryResult } from '@tanstack/react-query'
import { ProductCard } from '@/components/ui/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'

interface Props {
  title: string
  viewAllHref?: string
  query: UseQueryResult<any>
  cols?: number
  limit?: number
}

export function ProductSection({ title, viewAllHref, query, cols = 4, limit = 8 }: Props) {
  const { data, isLoading } = query
  const products: any[] = (Array.isArray(data) ? data : (data as any)?.items ?? []).slice(0, limit)

  return (
    <section className="my-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-sm text-primary font-medium hover:underline">
            Xem tất cả →
          </Link>
        )}
      </div>

      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-${Math.min(cols, 4)} lg:grid-cols-${cols} gap-4`}>
        {isLoading
          ? Array.from({ length: limit }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((p: any) => <ProductCard key={p.id} product={p} />)
        }
      </div>
    </section>
  )
}
