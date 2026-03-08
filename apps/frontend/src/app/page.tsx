'use client'
import { ProductCard, ProductCardSkeleton } from '@/components/ui/ProductCard'
import { productApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Dumbbell, Laptop, Shirt, Smartphone, Utensils, Zap } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

const BANNERS = [
  { id: '1', badge: '⚡ Flash Sale', title: 'Siêu Sale\nCuối Tuần', sub: 'Giảm đến 50% hàng ngàn sản phẩm', cta: 'Mua ngay', href: '/products?sort=price_asc', gradient: 'from-slate-900 via-slate-800 to-slate-700' },
  { id: '2', badge: '🌸 Hè 2026',   title: 'Thời Trang\nMùa Hè',    sub: 'Bộ sưu tập mới — Phong cách trẻ trung', cta: 'Khám phá', href: '/products', gradient: 'from-rose-700 via-pink-700 to-purple-800' },
  { id: '3', badge: '💻 Tech',       title: 'Laptop &\nĐiện Thoại', sub: 'Hiệu năng mạnh mẽ — Thiết kế đẳng cấp', cta: 'Xem ngay', href: '/products', gradient: 'from-cyan-800 via-slate-800 to-slate-900' },
]

function HeroBanner() {
  const [cur, setCur] = useState(0)
  const [paused, setPaused] = useState(false)
  const next = useCallback(() => setCur(c => (c + 1) % BANNERS.length), [])
  const prev = useCallback(() => setCur(c => (c - 1 + BANNERS.length) % BANNERS.length), [])

  useEffect(() => {
    if (paused) return
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [next, paused])

  const b = BANNERS[cur]

  return (
    <div className="relative h-[300px] md:h-[420px] rounded-2xl overflow-hidden"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {BANNERS.map((banner, i) => (
        <div key={banner.id}
          className={cn('absolute inset-0 bg-gradient-to-br transition-opacity duration-700', banner.gradient, i === cur ? 'opacity-100' : 'opacity-0')} />
      ))}
      <div className="relative z-10 h-full container-page flex items-center">
        <div className="max-w-lg" key={cur}>
          <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 bg-white/20 text-white border border-white/30">
            {b.badge}
          </span>
          <h1 className="font-display font-black text-4xl md:text-5xl text-white leading-tight whitespace-pre-line tracking-tight">
            {b.title}
          </h1>
          <p className="text-white/70 mt-3 text-base">{b.sub}</p>
          <Link href={b.href}
            className="inline-flex items-center gap-2 mt-6 font-bold text-sm px-6 py-3 rounded-xl text-slate-900 bg-white hover:bg-white/90 active:scale-95 transition-all shadow-lg">
            {b.cta} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/25 backdrop-blur-sm flex items-center justify-center z-20 transition-colors">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/25 backdrop-blur-sm flex items-center justify-center z-20 transition-colors">
        <ChevronRight className="h-5 w-5" />
      </button>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {BANNERS.map((_, i) => (
          <button key={i} onClick={() => setCur(i)}
            className={cn('rounded-full transition-all duration-300', i === cur ? 'w-7 h-2 bg-white' : 'w-2 h-2 bg-white/40')} />
        ))}
      </div>
    </div>
  )
}

const CATS = [
  { label: 'Điện thoại', href: '/products', icon: Smartphone, color: 'bg-blue-50 text-blue-600' },
  { label: 'Laptop',     href: '/products', icon: Laptop,     color: 'bg-purple-50 text-purple-600' },
  { label: 'Thời trang', href: '/products', icon: Shirt,      color: 'bg-pink-50 text-pink-600' },
  { label: 'Thể thao',   href: '/products', icon: Dumbbell,   color: 'bg-green-50 text-green-600' },
  { label: 'Sách',       href: '/products', icon: BookOpen,   color: 'bg-amber-50 text-amber-600' },
  { label: 'Nhà bếp',   href: '/products', icon: Utensils,   color: 'bg-red-50 text-red-600' },
]

function CategoryGrid() {
  return (
    <section>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {CATS.map((c) => (
          <Link key={c.label} href={c.href}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 bg-white border border-border">
            <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center', c.color)}>
              <c.icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-slate-800 text-center leading-tight">{c.label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function useCountdown(ms: number) {
  const calc = () => {
    const d = Math.max(0, ms - Date.now())
    return { h: Math.floor(d / 3_600_000), m: Math.floor((d % 3_600_000) / 60_000), s: Math.floor((d % 60_000) / 1000) }
  }
  const [t, setT] = useState(calc)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { const id = setInterval(() => setT(calc), 1000); return () => clearInterval(id) }, [ms])
  return { ...t, mounted }
}

function Digit({ v, label }: { v: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-slate-900 text-white font-mono font-black text-lg w-9 h-9 flex items-center justify-center rounded-lg tabular-nums">
        {String(v).padStart(2, '0')}
      </div>
      <span className="text-[9px] text-slate-400 mt-0.5 font-medium">{label}</span>
    </div>
  )
}

function ProductSection({ title, params, viewHref }: { title: string; params: any; viewHref: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['products-section', params],
    queryFn: () => productApi.list({ ...params, limit: 8 }),
  })
  const products = Array.isArray(data?.data) ? (data.data as any[]) : []

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-xl text-slate-900">{title}</h2>
        <Link href={viewHref} className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
          Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((p: any) => <ProductCard key={p.id} product={p} />)
        }
      </div>
    </section>
  )
}

export default function HomePage() {
  const endsAt = Date.now() + 3 * 3_600_000 + 24 * 60_000
  const time = useCountdown(endsAt)

  const { data: flashData, isLoading: flashLoading } = useQuery({
    queryKey: ['products-flash'],
    queryFn: () => productApi.list({ sort: 'best_seller', limit: 6 }),
  })
  const flashProducts = Array.isArray(flashData?.data) ? (flashData.data as any[]) : []

  return (
    <div className="container-page py-6 space-y-10">
      <HeroBanner />
      <CategoryGrid />

      {/* Flash Sale */}
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-orange-500 text-white px-3.5 py-1.5 rounded-xl font-bold text-sm">
              <Zap className="h-4 w-4 fill-white" /> FLASH SALE
            </div>
            <div className="flex items-center gap-1.5">
              {time.mounted ? (
                <>
                  <Digit v={time.h} label="Giờ" />
                  <span className="font-bold text-slate-800 pb-3">:</span>
                  <Digit v={time.m} label="Phút" />
                  <span className="font-bold text-slate-800 pb-3">:</span>
                  <Digit v={time.s} label="Giây" />
                </>
              ) : (
                <>
                  <Digit v={0} label="Giờ" />
                  <span className="font-bold text-slate-800 pb-3">:</span>
                  <Digit v={0} label="Phút" />
                  <span className="font-bold text-slate-800 pb-3">:</span>
                  <Digit v={0} label="Giây" />
                </>
              )}
            </div>
          </div>
          <Link href="/products" className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
            Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {flashLoading
            ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : flashProducts.map((p: any) => <ProductCard key={p.id} product={p} />)
          }
        </div>
      </section>

      {/* Promo banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Miễn phí ship', sub: 'Đơn hàng từ 299K', icon: '🚚', color: 'from-emerald-500 to-teal-600' },
          { label: 'Đổi trả 30 ngày', sub: 'Không cần lý do', icon: '🔄', color: 'from-blue-500 to-cyan-600' },
        ].map(b => (
          <div key={b.label} className={cn('flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r text-white', b.color)}>
            <span className="text-3xl">{b.icon}</span>
            <div>
              <p className="font-bold text-base">{b.label}</p>
              <p className="text-white/80 text-sm">{b.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <ProductSection title="Sản phẩm bán chạy" params={{ sort: 'best_seller' }} viewHref="/products?sort=best_seller" />
      <ProductSection title="Mới nhất" params={{ sort: 'newest' }} viewHref="/products?sort=newest" />
    </div>
  )
}
