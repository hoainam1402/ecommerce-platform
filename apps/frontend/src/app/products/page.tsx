'use client'
import { ProductCard, ProductCardSkeleton } from '@/components/ui/ProductCard'
import { productApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Filter, Grid3X3, List, SlidersHorizontal, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Mới nhất' },
  { value: 'best_seller',label: 'Bán chạy' },
  { value: 'top_rated',  label: 'Đánh giá cao' },
  { value: 'price_asc',  label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
]

const PRICE_RANGES = [
  { label: 'Dưới 500K',        min: 0,         max: 500000 },
  { label: '500K – 2 triệu',   min: 500000,    max: 2000000 },
  { label: '2 – 10 triệu',     min: 2000000,   max: 10000000 },
  { label: '10 – 30 triệu',    min: 10000000,  max: 30000000 },
  { label: 'Trên 30 triệu',    min: 30000000,  max: undefined },
]

const RATINGS = [5, 4, 3]

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [sort,      setSort]      = useState(searchParams.get('sort')     || 'newest')
  const [q,         setQ]         = useState(searchParams.get('q')        || '')
  const [priceIdx,  setPriceIdx]  = useState<number | null>(null)
  const [minRating, setMinRating] = useState<number | null>(null)
  const [page,      setPage]      = useState(1)
  const [gridView,  setGridView]  = useState<'grid' | 'list'>('grid')
  const [filterOpen,setFilterOpen]= useState(false)

  const priceRange = priceIdx !== null ? PRICE_RANGES[priceIdx] : null

  const queryParams = {
    q: q || undefined,
    sort,
    min_price: priceRange?.min,
    max_price: priceRange?.max,
    min_rating: minRating ?? undefined,
    page, limit: 20,
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', queryParams],
    queryFn:  () => productApi.list(queryParams),
    placeholderData: (prev) => prev,
  })

  const products = Array.isArray(data?.data) ? data.data : []
  const meta     = data?.meta

  const activeFilters: string[] = []
  if (q)         activeFilters.push(`"${q}"`)
  if (priceRange) activeFilters.push(priceRange.label)
  if (minRating) activeFilters.push(`${minRating}★ trở lên`)

  // ── Sidebar ───────────────────────────────────────────
  const Sidebar = () => (
    <div className="space-y-6">
      {/* Price */}
      <div>
        <h3 className="font-semibold text-sm text-text-primary mb-3">Khoảng giá</h3>
        <div className="space-y-1.5">
          {PRICE_RANGES.map((r, i) => (
            <label key={i} className="flex items-center gap-2.5 cursor-pointer group">
              <input type="radio" name="price" checked={priceIdx === i}
                onChange={() => { setPriceIdx(i === priceIdx ? null : i); setPage(1) }}
                className="accent-primary" />
              <span className={cn('text-sm transition-colors', priceIdx === i ? 'text-primary font-semibold' : 'text-text-secondary group-hover:text-primary')}>
                {r.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="font-semibold text-sm text-text-primary mb-3">Đánh giá</h3>
        <div className="space-y-1.5">
          {RATINGS.map(r => (
            <label key={r} className="flex items-center gap-2.5 cursor-pointer group">
              <input type="radio" name="rating" checked={minRating === r}
                onChange={() => { setMinRating(r === minRating ? null : r); setPage(1) }}
                className="accent-primary" />
              <span className="flex items-center gap-1 text-sm text-text-secondary group-hover:text-primary transition-colors">
                {'★'.repeat(r)}<span className="text-text-muted">{'☆'.repeat(5 - r)}</span>
                <span className="ml-1">trở lên</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear */}
      {(priceIdx !== null || minRating !== null) && (
        <button onClick={() => { setPriceIdx(null); setMinRating(null); setPage(1) }}
          className="text-sm text-danger hover:underline flex items-center gap-1">
          <X className="h-3.5 w-3.5" /> Xoá bộ lọc
        </button>
      )}
    </div>
  )

  return (
    <div className="container-page py-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-xl">
            {q ? `Kết quả cho "${q}"` : 'Tất cả sản phẩm'}
          </h1>
          {meta?.total != null && (
            <p className="text-sm text-text-muted mt-0.5">{meta.total.toLocaleString('vi-VN')} sản phẩm</p>
          )}
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map(f => (
              <span key={f} className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                {f}
              </span>
            ))}
          </div>
        )}

        {/* Sort */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <select value={sort} onChange={e => { setSort(e.target.value); setPage(1) }}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:border-primary cursor-pointer">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          </div>

          {/* Grid/list toggle */}
          <div className="hidden sm:flex border border-border rounded-xl overflow-hidden">
            {(['grid','list'] as const).map(v => (
              <button key={v} onClick={() => setGridView(v)}
                className={cn('p-2 transition-colors', gridView === v ? 'bg-primary text-white' : 'text-text-muted hover:bg-surface')}>
                {v === 'grid' ? <Grid3X3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </button>
            ))}
          </div>

          {/* Mobile filter toggle */}
          <button onClick={() => setFilterOpen(v => !v)}
            className="flex items-center gap-1.5 btn-outline btn-sm lg:hidden">
            <SlidersHorizontal className="h-4 w-4" /> Lọc
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="card p-4 sticky top-24">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Filter className="h-4 w-4" /> Bộ lọc
            </h2>
            <Sidebar />
          </div>
        </aside>

        {/* Mobile filter drawer */}
        {filterOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setFilterOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 animate-slide-up max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg">Bộ lọc</h2>
                <button onClick={() => setFilterOpen(false)}><X className="h-5 w-5" /></button>
              </div>
              <Sidebar />
              <button onClick={() => setFilterOpen(false)} className="btn-primary w-full mt-6">
                Áp dụng ({products.length} sản phẩm)
              </button>
            </div>
          </div>
        )}

        {/* Products */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className={cn('grid gap-4', gridView === 'grid'
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
              : 'grid-cols-1')}>
              {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-5xl mb-4">🔍</p>
              <p className="font-bold text-lg">Không tìm thấy sản phẩm</p>
              <p className="text-text-muted text-sm mt-2">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
              <button onClick={() => { setQ(''); setPriceIdx(null); setMinRating(null) }}
                className="btn-outline mt-5">Xoá bộ lọc</button>
            </div>
          ) : (
            <>
              <div className={cn('grid gap-4 transition-opacity', isFetching && 'opacity-60',
                gridView === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1')}>
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                    className="btn-outline btn-sm disabled:opacity-40">← Trước</button>
                  <span className="text-sm text-text-secondary px-3">
                    Trang {page} / {meta.totalPages}
                  </span>
                  <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}
                    className="btn-outline btn-sm disabled:opacity-40">Tiếp →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
