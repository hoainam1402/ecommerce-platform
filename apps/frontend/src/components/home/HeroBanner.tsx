'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Banner {
  id: string
  title: string
  subtitle: string
  ctaLabel: string
  ctaHref: string
  bgColor: string
  image: string
  badge?: string
}

// Default banners — thay bằng API sau
const DEFAULT_BANNERS: Banner[] = [
  {
    id: '1',
    title: 'Flash Sale Cuối Tuần',
    subtitle: 'Giảm đến 50% hàng ngàn sản phẩm điện tử',
    ctaLabel: 'Mua ngay',
    ctaHref: '/promotions/flash-sale',
    bgColor: 'from-primary-600 to-primary-900',
    image: '/banners/banner-1.jpg',
    badge: '⚡ Flash Sale',
  },
  {
    id: '2',
    title: 'Thời Trang Hè 2026',
    subtitle: 'Bộ sưu tập mới — Phong cách trẻ trung, năng động',
    ctaLabel: 'Khám phá',
    ctaHref: '/categories/thoi-trang',
    bgColor: 'from-rose-500 to-orange-500',
    image: '/banners/banner-2.jpg',
  },
  {
    id: '3',
    title: 'Laptop Siêu Mỏng',
    subtitle: 'Hiệu năng mạnh mẽ — Thiết kế sang trọng',
    ctaLabel: 'Xem ngay',
    ctaHref: '/categories/laptop',
    bgColor: 'from-slate-700 to-slate-900',
    image: '/banners/banner-3.jpg',
  },
]

interface Props {
  banners?: Banner[]
}

export function HeroBanner({ banners = DEFAULT_BANNERS }: Props) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused]   = useState(false)

  const next = useCallback(() => setCurrent(c => (c + 1) % banners.length), [banners.length])
  const prev = useCallback(() => setCurrent(c => (c - 1 + banners.length) % banners.length), [banners.length])

  useEffect(() => {
    if (paused) return
    const id = setInterval(next, 5000)
    return () => clearInterval(id)
  }, [next, paused])

  const banner = banners[current]

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{ aspectRatio: '16/6' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background */}
      {banners.map((b, i) => (
        <div key={b.id}
          className={cn(
            'absolute inset-0 bg-gradient-to-r transition-opacity duration-700',
            b.bgColor,
            i === current ? 'opacity-100' : 'opacity-0',
          )}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container-page w-full flex items-center justify-between">
          <div className="max-w-lg">
            {banner.badge && (
              <span className="inline-block bg-warning text-white text-xs font-bold px-3 py-1 rounded-full mb-3 animate-fade-in">
                {banner.badge}
              </span>
            )}
            <h1 className="font-display font-black text-3xl md:text-5xl text-white leading-tight text-balance animate-fade-in">
              {banner.title}
            </h1>
            <p className="text-white/80 mt-3 text-sm md:text-base animate-fade-in">
              {banner.subtitle}
            </p>
            <Link href={banner.ctaHref}
              className="inline-flex items-center gap-2 mt-6 bg-white text-primary font-semibold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors shadow-lg animate-fade-in">
              {banner.ctaLabel} →
            </Link>
          </div>
        </div>
      </div>

      {/* Nav arrows */}
      <button onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors flex items-center justify-center backdrop-blur-sm z-20">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors flex items-center justify-center backdrop-blur-sm z-20">
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {banners.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={cn('rounded-full transition-all duration-300',
              i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80')}
          />
        ))}
      </div>
    </div>
  )
}
