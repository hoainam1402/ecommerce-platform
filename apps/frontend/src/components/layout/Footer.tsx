import Link from 'next/link'
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react'

const FOOTER_LINKS = {
  'Về chúng tôi': [
    { label: 'Giới thiệu', href: '/about' },
    { label: 'Tuyển dụng', href: '/careers' },
    { label: 'Tin tức', href: '/blog' },
    { label: 'Liên hệ', href: '/contact' },
  ],
  'Hỗ trợ khách hàng': [
    { label: 'Chính sách đổi trả', href: '/return-policy' },
    { label: 'Chính sách vận chuyển', href: '/shipping-policy' },
    { label: 'Hướng dẫn mua hàng', href: '/how-to-buy' },
    { label: 'Câu hỏi thường gặp', href: '/faq' },
  ],
  'Danh mục sản phẩm': [
    { label: 'Điện thoại', href: '/categories/dien-thoai' },
    { label: 'Laptop', href: '/categories/laptop' },
    { label: 'Thời trang', href: '/categories/thoi-trang' },
    { label: 'Nhà bếp', href: '/categories/nha-bep' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-primary-600 text-white mt-16">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Brand */}
        <div className="lg:col-span-2">
          <span className="font-display font-black text-3xl tracking-tight">
            ECOM<span className="text-accent">.</span>
          </span>
          <p className="mt-3 text-primary-100 text-sm leading-relaxed max-w-xs">
            Nền tảng mua sắm trực tuyến tin cậy, mang đến trải nghiệm mua sắm tốt nhất cho khách hàng.
          </p>

          {/* Contact */}
          <div className="mt-4 space-y-2 text-sm text-primary-100">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 flex-shrink-0" />
              <span>1900 xxxx (8:00 - 21:00)</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span>support@ecommerce.vn</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>123 Nguyễn Huệ, Q.1, TP.HCM</span>
            </div>
          </div>

          {/* Social */}
          <div className="flex items-center gap-3 mt-5">
            {[
              { icon: Facebook,  href: '#', label: 'Facebook' },
              { icon: Instagram, href: '#', label: 'Instagram' },
              { icon: Youtube,   href: '#', label: 'Youtube' },
            ].map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} aria-label={label}
                className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Links */}
        {Object.entries(FOOTER_LINKS).map(([title, links]) => (
          <div key={title}>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">{title}</h3>
            <ul className="space-y-2.5">
              {links.map(link => (
                <li key={link.href}>
                  <Link href={link.href}
                    className="text-sm text-primary-100 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-primary-200">
          <p>© 2026 ECOM. Bảo lưu mọi quyền.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Chính sách bảo mật</Link>
            <Link href="/terms"   className="hover:text-white transition-colors">Điều khoản dịch vụ</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
