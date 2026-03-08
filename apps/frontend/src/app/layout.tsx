import type { Metadata } from 'next'
import { Be_Vietnam_Pro, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MiniCart } from '@/components/layout/MiniCart'
import { Providers } from './providers'

const beVietnam = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-be-vietnam',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'ECOM — Mua sắm thông minh', template: '%s | ECOM' },
  description: 'Nền tảng mua sắm trực tuyến tin cậy với hàng ngàn sản phẩm chính hãng',
  keywords: ['mua sắm', 'thương mại điện tử', 'điện thoại', 'laptop', 'thời trang'],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'ECOM',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnam.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans bg-white text-text-primary antialiased">
        <Providers>
          <Header />
          <MiniCart />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
