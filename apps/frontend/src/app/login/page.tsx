'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/lib/api'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const redirect    = searchParams.get('redirect') || '/'
  const { login }   = useAuthStore()

  const [mode,     setMode]     = useState<'login'|'register'>('login')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '' })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        const res = await authApi.register({ email: form.email, password: form.password, full_name: form.full_name, phone: form.phone || undefined })
        const { accessToken, refreshToken, user } = res.data
        useAuthStore.setState({ accessToken, refreshToken, user })
      }
      router.push(redirect)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || (mode === 'login' ? 'Sai email hoặc mật khẩu' : 'Đăng ký thất bại'))
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-[calc(100vh-9rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="card p-8 shadow-soft">
          {/* Logo */}
          <div className="text-center mb-7">
            <Link href="/" className="inline-flex items-center gap-2 mb-5">
              <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-display font-black text-lg">E</span>
              </div>
              <span className="font-display font-black text-2xl text-primary">ECOM</span>
            </Link>
            <h1 className="font-display font-bold text-2xl">
              {mode === 'login' ? 'Chào mừng trở lại!' : 'Tạo tài khoản'}
            </h1>
            <p className="text-text-muted text-sm mt-1">
              {mode === 'login' ? 'Đăng nhập để tiếp tục mua sắm' : 'Đăng ký để nhận ưu đãi độc quyền'}
            </p>
          </div>

          {/* Toggle */}
          <div className="flex bg-surface rounded-xl p-1 mb-6">
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                className={cn('flex-1 py-2 rounded-lg text-sm font-semibold transition-all',
                  mode === m ? 'bg-white shadow-card text-primary' : 'text-text-muted hover:text-primary')}>
                {m === 'login' ? 'Đăng nhập' : 'Đăng ký'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input value={form.full_name} onChange={set('full_name')} required
                  placeholder="Họ và tên" className="input-base pl-10" />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input type="email" value={form.email} onChange={set('email')} required
                placeholder="Email" className="input-base pl-10" />
            </div>

            {mode === 'register' && (
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input value={form.phone} onChange={set('phone')}
                  placeholder="Số điện thoại (tùy chọn)" className="input-base pl-10" />
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')}
                required minLength={8} placeholder="Mật khẩu (tối thiểu 8 ký tự)"
                className="input-base pl-10 pr-10" />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {mode === 'login' && (
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">Quên mật khẩu?</Link>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-danger/20 rounded-xl text-sm text-danger">{error}</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-1">
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang xử lý...</>
                : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>

            {/* Quick test */}
            {mode === 'login' && (
              <div className="border-t border-border pt-4 space-y-2">
                <p className="text-xs text-text-muted text-center">Test nhanh:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, email: 'admin@ecom.vn', password: 'Admin@123' }))}
                    className="text-xs btn-ghost border border-border rounded-lg py-2">
                    👑 Admin
                  </button>
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, email: 'nguyen.van.a@gmail.com', password: 'Customer@123' }))}
                    className="text-xs btn-ghost border border-border rounded-lg py-2">
                    👤 Customer
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <p className="text-center text-sm text-text-muted mt-5">
          {mode === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-primary font-semibold hover:underline">
            {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </p>
      </div>
    </div>
  )
}
