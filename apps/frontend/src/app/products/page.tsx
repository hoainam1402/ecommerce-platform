'use client'
import { useState, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal, LayoutGrid, List, X, ChevronDown, ChevronUp } from 'lucide-react'
import { productApi, searchApi } from '@/lib/api'
import { ProductCard } from '@/components/ui/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { cn, formatPrice } from '@/lib/utils'

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Mới nhất' },
  { value: 'best_seller', label: 'Bán chạy' },
  { value: 'top_rated',  label: 'Đánh giá cao' },
  { value: 'price_asc',  label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
]

const RATING_OPTIONS = [5, 4, 3]

function FilterSection({ title, children, defaultOpen = true }:
  { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border pb-4 mb-4">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full py-1 text-sm font-semibold text-text-primary">
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  )
}

export default function PLPPage() {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()
  const [showFilter, setShowFilter] = useState(false)
  const [viewMode,   setViewMode]   = useState<'grid' | 'list'>('grid')

  // Read params
  const q          = searchParams.get('q') ?? ''
  const sort       = searchParams.get('sort') ?? 'newest'
  const minPrice   = searchParams.get('min_price')
  const maxPrice   = searchParams.get('max_price')
  const minRating  = searchParams.get('min_rating')
  const categoryId = searchParams.get('category_id')
  const page       = Number(searchParams.get('page') ?? 1)

  const updateParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null) params.delete(key)
    else { params.set(key, value); params.set('page', '1') }
    router.push(`${pathname}?${params.toString()}`)
  }, [searchParams, pathname, router])

  // Fetch products
  const { data, isLoading } = useQuery({
    queryKey: ['products', 'list', Object.fromEntries(searchParams.entries())],
    queryFn:  () => productApi.list({
      q, sort, min_price: minPrice, max_price: maxPrice,
      min_rating: minRating, category_id: categoryId, page, limit: 20,
    }),
  })

  const products: any[]  = (data as any)?.items ?? (Array.isArray(data) ? data : [])
  const meta: any        = (data as any)?.meta ?? {}
  const totalCount       = meta.total ?? products.length

  // Active filters for chips
  const activeFilters = [
    minRating  && { key: 'min_rating',  label: `≥ ${minRating} sao` },
    minPrice   && { key: 'min_price',   label: `Từ ${formatPrice(+minPrice)}` },
    maxPrice   && { key: 'max_price',   label: `Đến ${formatPrice(+maxPrice)}` },
    categoryId && { key: 'category_id', label: 'Danh mục đã chọn' },
  ].filter(Boolean) as { key: string; label: string }[]

  const FilterPanel = (
    <aside className="w-56 flex-shrink-0 space-y-0">
      {/* Price range */}
      <FilterSection title="Khoảng giá">
        <div className="space-y-2">
          {[
            [null, '200000',     'Dưới 200.000đ'],
            ['200000', '500000', '200k - 500k'],
            ['500000', '1000000','500k - 1 triệu'],
            ['1000000', '5000000','1 - 5 triệu'],
            ['5000000', null,    'Trên 5 triệu'],
          ].map(([min, max, label]) => (
            <button key={label as string}
              onClick={() => {
                updateParam('min_price', min as string | null)
                updateParam('max_price', max as string | null)
              }}
              className={cn('flex items-center gap-2 text-sm w-full text-left hover:text-primary transition-colors',
                minPrice === min && maxPrice === max ? 'text-primary font-medium' : 'text-text-secondary',
              )}>
              <span className={cn('h-4 w-4 rounded border-2 flex-shrink-0 transition-colors',
                minPrice === min && maxPrice === max ? 'border-primary bg-primary' : 'border-border')} />
              {label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Đánh giá">
        <div className="space-y-2">
          {RATING_OPTIONS.map(r => (
            <button key={r}
              onClick={() => updateParam('min_rating', minRating === String(r) ? null : String(r))}
              className={cn('flex items-center gap-2 text-sm w-full text-left hover:text-primary transition-colors',
                minRating === String(r) ? 'text-primary font-medium' : 'text-text-secondary',
              )}>
              <span className={cn('h-4 w-4 rounded border-2 flex-shrink-0',
                minRating === String(r) ? 'border-primary bg-primary' : 'border-border')} />
              {'⭐'.repeat(r)} trở lên
            </button>
          ))}
        </div>
      </FilterSection>
    </aside>
  )

  return (
    <div className="container-page py-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-text-secondary mb-4 flex items-center gap-1.5">
        <a href="/" className="hover:text-primary">Trang chủ</a>
        <span>/</span>
        <span className="text-text-primary font-medium">
          {q ? `Kết quả cho "${q}"` : 'Tất cả sản phẩm'}
        </span>
      </nav>

      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-text-primary">
            {q ? `Kết quả cho "${q}"` : 'Sản phẩm'}
          </h1>
          {totalCount > 0 && (
            <span className="text-sm text-text-secondary">({totalCount} sản phẩm)</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile filter toggle */}
          <Button variant="outline" size="sm"
            onClick={() => setShowFilter(s => !s)}
            className="md:hidden"
            leftIcon={<SlidersHorizontal className="h-4 w-4" />}>
            Lọc
          </Button>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => updateParam('sort', e.target.value)}
            className="input-base h-9 w-auto text-sm pr-8 cursor-pointer"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* View mode */}
          <div className="hidden md:flex items-center border border-border rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('grid')}
              className={cn('h-9 w-9 flex items-center justify-center transition-colors',
                viewMode === 'grid' ? 'bg-primary text-white' : 'hover:bg-surface text-text-secondary')}>
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode('list')}
              className={cn('h-9 w-9 flex items-center justify-center transition-colors',
                viewMode === 'list' ? 'bg-primary text-white' : 'hover:bg-surface text-text-secondary')}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="text-xs text-text-secondary">Đang lọc:</span>
          {activeFilters.map(f => (
            <button key={f.key}
              onClick={() => updateParam(f.key, null)}
              className="flex items-center gap-1 bg-primary-50 text-primary text-xs px-3 py-1.5 rounded-full hover:bg-primary-100 transition-colors font-medium">
              {f.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            onClick={() => router.push(pathname)}
            className="text-xs text-text-secondary underline hover:text-accent">
            Xóa tất cả
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <div className="hidden md:block">{FilterPanel}</div>

        {/* Mobile filter panel */}
        {showFilter && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilter(false)} />
            <div className="relative ml-auto w-72 h-full bg-white overflow-y-auto p-4 animate-slide-in-right">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Bộ lọc</h3>
                <button onClick={() => setShowFilter(false)}><X className="h-5 w-5" /></button>
              </div>
              {FilterPanel}
            </div>
          </div>
        )}

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className={cn('grid gap-4',
              viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1')}>
              {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-secondary gap-3">
              <span className="text-5xl">😕</span>
              <p className="font-medium">Không tìm thấy sản phẩm phù hợp</p>
              <Button variant="outline" size="sm" onClick={() => router.push(pathname)}>
                Xóa bộ lọc
              </Button>
            </div>
          ) : (
            <>
              <div className={cn('grid gap-4',
                viewMode === 'grid'
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                  : 'grid-cols-1')}>
                {products.map((p: any) => (
                  <ProductCard key={p.id} product={p}
                    variant={viewMode === 'list' ? 'horizontal' : 'vertical'} />
                ))}
              </div>

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 2)
                    .map((p, idx, arr) => (
                      <span key={p}>
                        {idx > 0 && arr[idx-1] !== p - 1 && (
                          <span className="text-text-secondary px-1">...</span>
                        )}
                        <button
                          onClick={() => updateParam('page', String(p))}
                          className={cn('h-9 w-9 rounded-lg text-sm font-medium transition-colors',
                            p === page
                              ? 'bg-primary text-white'
                              : 'border border-border hover:border-primary hover:text-primary')}>
                          {p}
                        </button>
                      </span>
                    ))
                  }
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
