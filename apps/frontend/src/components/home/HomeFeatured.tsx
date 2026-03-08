'use client'
import { useQuery } from '@tanstack/react-query'
import { ProductSection } from './ProductSection'
import { productApi } from '@/lib/api'

export function HomeFeatured() {
  const newProducts = useQuery({
    queryKey: ['products', 'newest'],
    queryFn:  () => productApi.list({ sort: 'newest', limit: 8 }),
  })

  const bestSellers = useQuery({
    queryKey: ['products', 'best-seller'],
    queryFn:  () => productApi.list({ sort: 'best_seller', limit: 8 }),
  })

  return (
    <>
      <ProductSection
        title="Sản phẩm mới nhất"
        viewAllHref="/products?sort=newest"
        query={newProducts}
        cols={4}
        limit={8}
      />
      <ProductSection
        title="Bán chạy nhất"
        viewAllHref="/products?sort=best_seller"
        query={bestSellers}
        cols={4}
        limit={8}
      />
    </>
  )
}
