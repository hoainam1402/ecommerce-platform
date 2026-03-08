'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search, ShoppingCart, User, Menu, X,
  ChevronDown, Heart, Bell, LogOut, Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { useCartStore } from '@/stores/cart.store'
import { searchApi } from '@/lib/api'

const NAV_LINKS = [
  { label: 'Điện thoại',  href: '/categories/dien-thoai' },
  { label: 'Laptop',      href: '/categories/laptop' },
  { label: 'Thời trang',  href: '/categories/thoi-trang' },
  { label: 'Nhà bếp',     href: '/categories/nha-bep' },
  { label: '🔥 Khuyến mãi', href: '/promotions', className: 'text-accent font-semibold' },
]

export function Header() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { cart, toggleCart } = useCartStore()
  const [query, setQuery]           = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggest, setShowSuggest] = useState(false)
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [scrolled, setScrolled]       = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Sticky header on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Autocomplete
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return }
    const timer = setTimeout(async () => {
      try {
        const res: any = await searchApi.autocomplete(query)
        setSuggestions(Array.isArray(res) ? res.slice(0, 8) : [])
        setShowSuggest(true)
      } catch {}
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) setShowSuggest(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (q?: string) => {
    const term = q ?? query
    if (!term.trim()) return
    setShowSuggest(false)
    router.push(`/search?q=${encodeURIComponent(term)}`)
  }

  const itemCount = cart?.itemCount ?? 0

  return (
    <header className={cn(
      'sticky top-0 z-50 bg-white transition-shadow duration-300',
      scrolled ? 'shadow-dropdown' : 'shadow-sm',
    )}>
      {/* Top bar */}
      <div className="bg-primary-600 text-white text-xs py-1.5 text-center hidden md:block">
        🚚 Miễn phí vận chuyển đơn hàng từ 300.000đ &nbsp;|&nbsp; Hotline: 1900 xxxx
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Mobile menu */}
        <button className="md:hidden" onClick={() => setMobileOpen(o => !o)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <span className="font-display font-black text-2xl text-primary tracking-tight">
            ECOM<span className="text-accent">.</span>
          </span>
        </Link>

        {/* Search bar */}
        <div ref={searchRef} className="flex-1 max-w-2xl relative hidden md:block">
          <div className="flex items-center border-2 border-border rounded-xl overflow-hidden focus-within:border-primary transition-colors">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              onFocus={() => suggestions.length > 0 && setShowSuggest(true)}
              className="flex-1 h-10 px-4 text-sm outline-none bg-transparent"
            />
            <button
              onClick={() => handleSearch()}
              className="h-10 px-4 bg-primary text-white hover:bg-primary-700 transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          {/* Autocomplete dropdown */}
          {showSuggest && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-dropdown border border-border z-50 overflow-hidden animate-fade-in">
              {suggestions.map((s, i) => (
                <button key={i}
                  onClick={() => { setQuery(s); handleSearch(s) }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface flex items-center gap-3">
                  <Search className="h-3.5 w-3.5 text-text-secondary flex-shrink-0" />
                  {s}
                </button>
              ))}
              <div className="border-t border-border">
                <button onClick={() => handleSearch()}
                  className="w-full text-left px-4 py-2.5 text-sm text-primary font-medium hover:bg-surface">
                  Xem tất cả kết quả cho "{query}" →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto md:ml-0">
          {/* Mobile search */}
          <button className="md:hidden h-10 w-10 flex items-center justify-center hover:bg-surface rounded-lg">
            <Search className="h-5 w-5" />
          </button>

          {/* Wishlist */}
          <Link href="/wishlist" className="hidden md:flex h-10 w-10 items-center justify-center hover:bg-surface rounded-lg relative">
            <Heart className="h-5 w-5 text-text-secondary" />
          </Link>

          {/* Cart */}
          <button onClick={toggleCart}
            className="h-10 w-10 flex items-center justify-center hover:bg-surface rounded-lg relative">
            <ShoppingCart className="h-5 w-5 text-text-secondary" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </button>

          {/* User */}
          {user ? (
            <div className="relative group hidden md:block">
              <button className="h-10 px-3 flex items-center gap-2 hover:bg-surface rounded-lg">
                <div className="h-7 w-7 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {user.fullName?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-text-secondary" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-dropdown border border-border overflow-hidden hidden group-hover:block animate-fade-in">
                <div className="px-4 py-3 border-b border-border">
                  <p className="font-semibold text-sm">{user.fullName}</p>
                  <p className="text-xs text-text-secondary">{user.email}</p>
                </div>
                <Link href="/account/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface">
                  <Package className="h-4 w-4 text-text-secondary" /> Đơn hàng của tôi
                </Link>
                <Link href="/account" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface">
                  <User className="h-4 w-4 text-text-secondary" /> Tài khoản
                </Link>
                <button onClick={() => logout()}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface text-accent">
                  <LogOut className="h-4 w-4" /> Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <Link href="/login"
              className="hidden md:flex items-center gap-2 h-10 px-3 hover:bg-surface rounded-lg text-sm font-medium">
              <User className="h-4 w-4 text-text-secondary" />
              Đăng nhập
            </Link>
          )}
        </div>
      </div>

      {/* Category nav */}
      <nav className="hidden md:block border-t border-border">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 h-10">
          {NAV_LINKS.map(link => (
            <Link key={link.href} href={link.href}
              className={cn('text-sm hover:text-primary transition-colors whitespace-nowrap', link.className)}>
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white animate-fade-in">
          <div className="px-4 py-3">
            <div className="flex items-center border-2 border-border rounded-xl overflow-hidden">
              <input
                type="text" placeholder="Tìm kiếm..." value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="flex-1 h-10 px-4 text-sm outline-none" />
              <button onClick={() => handleSearch()}
                className="h-10 px-4 bg-primary text-white">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
          <nav className="pb-3">
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn('block px-4 py-3 text-sm border-b border-border/50 hover:bg-surface', link.className)}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
