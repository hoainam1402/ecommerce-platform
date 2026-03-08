'use client'
import { ProductCard } from '@/components/ui/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { promotionApi } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Zap } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface TimeLeft { hours: number; minutes: number; seconds: number }

function useCountdown(targetMs: number): TimeLeft {
  const calc = (): TimeLeft => {
    const diff = Math.max(0, targetMs - Date.now())
    return {
      hours:   Math.floor(diff / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
      seconds: Math.floor((diff % 60_000) / 1000),
    }
  }
  const [time, setTime] = useState<TimeLeft>(calc)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setTime(calc), 1000)
    return () => clearInterval(id)
  }, [targetMs])

  return { ...time, mounted }
}

function Digit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-text-primary text-white font-mono font-bold text-xl w-10 h-10 flex items-center justify-center rounded-lg">
        {String(value).padStart(2, '0')}
      </div>
      <span className="text-[10px] text-text-secondary mt-0.5">{label}</span>
    </div>
  )
}

export function FlashSale() {
  const { data, isLoading } = useQuery({
    queryKey: ['flash-sales'],
    queryFn:  () => promotionApi.flashSales(),
  })

  const flashSales: any[] = (data as any) ?? []
  const firstSale = flashSales[0]

  // Countdown đến khi kết thúc flash sale (hoặc 3h từ bây giờ nếu không có data)
  const endsAt = firstSale?.expiresAt
    ? new Date(firstSale.expiresAt).getTime()
    : Date.now() + 3 * 3_600_000
  const time = useCountdown(endsAt)

  const products = firstSale?.products ?? []

  if (!isLoading && products.length === 0) return null

  return (
    <section className="my-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-accent text-white px-3 py-1.5 rounded-xl font-bold text-sm">
            <Zap className="h-4 w-4 fill-white" />
            FLASH SALE
          </div>
          <div className="flex items-center gap-1.5">
            {time.mounted ? (
              <>
                <Digit value={time.hours}   label="Giờ" />
                <span className="font-bold text-text-primary mb-3">:</span>
                <Digit value={time.minutes} label="Phút" />
                <span className="font-bold text-text-primary mb-3">:</span>
                <Digit value={time.seconds} label="Giây" />
              </>
            ) : (
              <>
                <Digit value={0} label="Giờ" />
                <span className="font-bold text-text-primary mb-3">:</span>
                <Digit value={0} label="Phút" />
                <span className="font-bold text-text-primary mb-3">:</span>
                <Digit value={0} label="Giây" />
              </>
            )}
          </div>
        </div>
        <Link href="/promotions/flash-sale"
          className="text-sm text-primary font-medium hover:underline">
          Xem tất cả →
        </Link>
      </div>

      {/* Products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.slice(0, 6).map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))
        }
      </div>
    </section>
  )
}
