'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { productApi } from '@/lib/api'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

// Icon fallbacks nếu không có image
const CATEGORY_ICONS: Record<string, string> = {
  'dien-thoai': '📱',
  'laptop':     '💻',
  'thoi-trang': '👗',
  'nha-bep':    '🍳',
  'am-nhac':    '🎵',
  'the-thao':   '⚽',
  'sach':       '📚',
  'lam-dep':    '💄',
}

export function CategoryGrid() {
  const { data, isLoading } = useQuery({
    queryKey: ['categories', 'featured'],
    queryFn:  () => productApi.categories(),
  })

  const categories: any[] = ((data as any) ?? []).slice(0, 10)

  return (
    <section className="my-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">Danh mục nổi bật</h2>
        <Link href="/categories" className="text-sm text-primary font-medium hover:underline">
          Xem tất cả →
        </Link>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 md:gap-3">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))
          : categories.map((cat: any) => (
              <Link key={cat.id} href={`/categories/${cat.slug}`}
                className="flex flex-col items-center gap-2 group">
                <div className={cn(
                  'h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-200',
                  'bg-primary-50 group-hover:bg-primary group-hover:scale-110 group-hover:shadow-md',
                )}>
                  {cat.imageUrl ? (
                    <Image src={cat.imageUrl} alt={cat.name} width={32} height={32}
                      className="object-contain group-hover:brightness-0 group-hover:invert transition-all" />
                  ) : (
                    <span className="text-2xl">
                      {CATEGORY_ICONS[cat.slug] ?? '🛍️'}
                    </span>
                  )}
                </div>
                <span className="text-xs text-center text-text-secondary group-hover:text-primary transition-colors leading-tight line-clamp-2">
                  {cat.name}
                </span>
              </Link>
            ))
        }
      </div>
    </section>
  )
}
