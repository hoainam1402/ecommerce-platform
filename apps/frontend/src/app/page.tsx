import { Metadata } from 'next'
import { HeroBanner }     from '@/components/home/HeroBanner'
import { CategoryGrid }   from '@/components/home/CategoryGrid'
import { FlashSale }      from '@/components/home/FlashSale'
import { ProductSection } from '@/components/home/ProductSection'
import { HomeFeatured }   from '@/components/home/HomeFeatured'

export const metadata: Metadata = {
  title: 'ECOM — Mua sắm thông minh',
}

export default function HomePage() {
  return (
    <div className="container-page py-4">
      {/* S02-1: Hero Banner */}
      <HeroBanner />

      {/* S02-2: Category Grid */}
      <CategoryGrid />

      {/* S02-3: Flash Sale */}
      <FlashSale />

      {/* S02-4: New Products */}
      <HomeFeatured />

      {/* Mid-page promo banner */}
      <div className="my-8 bg-gradient-to-r from-primary to-primary-light rounded-2xl p-8 flex items-center justify-between overflow-hidden relative">
        <div className="relative z-10">
          <p className="text-white/70 text-sm font-medium mb-1">Ưu đãi đặc biệt</p>
          <h3 className="font-display font-black text-2xl md:text-3xl text-white">
            Mua 2 tặng 1 🎁
          </h3>
          <p className="text-white/80 text-sm mt-2">Áp dụng cho tất cả sản phẩm thời trang</p>
        </div>
        <a href="/promotions"
          className="flex-shrink-0 bg-white text-primary font-semibold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors text-sm shadow-lg">
          Xem ngay →
        </a>
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -right-4 -bottom-12 h-40 w-40 rounded-full bg-white/5" />
      </div>
    </div>
  )
}
