import Link from 'next/link'

const LINKS = {
  'Sản phẩm':    [{ label: 'Điện thoại', href: '/products?category=dien-thoai' }, { label: 'Laptop', href: '/products?category=laptop' }, { label: 'Thời trang', href: '/products?category=thoi-trang' }, { label: 'Thể thao', href: '/products?category=the-thao' }],
  'Hỗ trợ':      [{ label: 'Trung tâm hỗ trợ', href: '#' }, { label: 'Theo dõi đơn hàng', href: '/account?tab=orders' }, { label: 'Đổi trả hàng', href: '#' }, { label: 'Chính sách bảo hành', href: '#' }],
  'Về chúng tôi':[{ label: 'Giới thiệu', href: '#' }, { label: 'Tuyển dụng', href: '#' }, { label: 'Blog', href: '#' }, { label: 'Liên hệ', href: '#' }],
}

export function Footer() {
  return (
    <footer className="bg-primary-900 text-white mt-16">
      <div className="container-page py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-primary font-display font-black text-sm">E</span>
              </div>
              <span className="font-display font-black text-xl">ECOM</span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed">
              Nền tảng mua sắm trực tuyến tin cậy với hàng ngàn sản phẩm chính hãng.
            </p>
            <div className="flex gap-3 mt-5">
              {['Facebook', 'Instagram', 'TikTok'].map(s => (
                <a key={s} href="#" className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-medium">
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-bold text-sm mb-4">{title}</h3>
              <ul className="space-y-2.5">
                {links.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-white/60 text-sm hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p>© 2026 ECOM. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="#" className="hover:text-white/70">Điều khoản</Link>
            <Link href="#" className="hover:text-white/70">Bảo mật</Link>
            <Link href="#" className="hover:text-white/70">Cookie</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
