'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, ShoppingCart, User, Menu, X, ChevronDown, LogOut, Package, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/stores/cart.store'
import { useAuthStore } from '@/stores/auth.store'

const NAV_LINKS = [
  { label: 'Điện tử',    href: '/products?category=dien-thoai' },
  { label: 'Laptop',     href: '/products?category=laptop' },
  { label: 'Thời trang', href: '/products?category=thoi-trang' },
  { label: 'Thể thao',   href: '/products?category=the-thao' },
  { label: '🔥 Sale',    href: '/products?sort=price_asc', accent: true },
]

export function Header() {
  const router = useRouter()
  const [scrolled,   setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search,     setSearch]     = useState('')
  const [userOpen,   setUserOpen]   = useState(false)
  const userRef = useRef<HTMLDivElement>(null)

  const itemCount = useCartStore(s => s.itemCount)
  const setCartOpen = useCartStore(s => s.setOpen)
  const { user, logout } = useAuthStore()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) router.push(`/products?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <header className={cn(
      'sticky top-0 z-50 transition-all duration-300 bg-white',
      scrolled ? 'shadow-soft border-b border-border' : 'border-b border-border/50'
    )}>
      <div className="container-page">
        <div className="flex items-center h-16 gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-display font-black text-sm">E</span>
            </div>
            <span className="font-display font-black text-xl text-primary tracking-tight hidden sm:block">ECOM</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">

            {/* Search mobile */}
            <Link href="/products" className="btn-ghost md:hidden p-2">
              <Search className="h-5 w-5" />
            </Link>

            {/* Cart */}
            <button onClick={() => setCartOpen(true)}
              className="btn-ghost relative p-2">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4.5 min-w-[18px] px-1 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>

            {/* User */}
            {user ? (
              <div ref={userRef} className="relative">
                <button onClick={() => setUserOpen(v => !v)}
                  className="flex items-center gap-2 btn-ghost px-2 py-1.5">
                  <div className="h-7 w-7 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary text-xs font-bold">{user.fullName[0]}</span>
                  </div>
                  <span className="text-sm font-medium hidden lg:block max-w-[100px] truncate">{user.fullName}</span>
                  <ChevronDown className={cn('h-3.5 w-3.5 text-text-muted transition-transform', userOpen && 'rotate-180')} />
                </button>

                {userOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-2xl border border-border shadow-card-hover py-1.5 animate-slide-down">
                    <div className="px-4 py-2.5 border-b border-border mb-1">
                      <p className="font-semibold text-sm">{user.fullName}</p>
                      <p className="text-xs text-text-muted">{user.email}</p>
                    </div>
                    {[
                      { href: '/account', icon: User,    label: 'Tài khoản' },
                      { href: '/account?tab=orders', icon: Package, label: 'Đơn hàng' },
                      { href: '/account?tab=wishlist', icon: Heart, label: 'Yêu thích' },
                    ].map(({ href, icon: Icon, label }) => (
                      <Link key={href} href={href} onClick={() => setUserOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-surface transition-colors">
                        <Icon className="h-4 w-4 text-text-secondary" />
                        {label}
                      </Link>
                    ))}
                    <button onClick={() => { logout(); setUserOpen(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger hover:bg-red-50 transition-colors mt-1 border-t border-border">
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="btn-primary btn-sm hidden sm:flex">
                Đăng nhập
              </Link>
            )}

            {/* Mobile menu */}
            <button onClick={() => setMobileOpen(v => !v)} className="btn-ghost p-2 md:hidden">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Nav links — desktop */}
        <nav className="hidden md:flex items-center gap-1 h-11 -mt-1">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href}
              className={cn('text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-surface transition-colors',
                l.accent ? 'text-accent hover:text-orange-600' : 'text-text-secondary hover:text-primary')}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white animate-slide-down">
          <div className="container-page py-3 space-y-1">
            <form onSubmit={handleSearch} className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Tìm kiếm..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:border-primary" />
            </form>
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                className={cn('block px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-surface',
                  l.accent ? 'text-accent' : 'text-text-primary')}>
                {l.label}
              </Link>
            ))}
            {!user && (
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="block btn-primary text-center mt-2">
                Đăng nhập / Đăng ký
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
