'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const { login, register, isLoading } = useAuthStore()
  const [tab, setTab]           = useState<'login' | 'register'>('login')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')

  // Login form
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  // Register form
  const [regData, setRegData] = useState({
    email: '', password: '', fullName: '', phone: '',
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(loginData.email, loginData.password)
      router.push('/')
    } catch (err: any) {
      setError(err?.error?.message ?? 'Email hoặc mật khẩu không đúng')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await register(regData)
      router.push('/')
    } catch (err: any) {
      setError(err?.error?.message ?? 'Đăng ký thất bại')
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="font-display font-black text-3xl text-primary tracking-tight">
              ECOM<span className="text-accent">.</span>
            </span>
          </Link>
          <p className="text-text-secondary text-sm mt-2">Chào mừng bạn trở lại</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {/* Tabs */}
          <div className="flex">
            {(['login', 'register'] as const).map(t => (
              <button key={t}
                onClick={() => { setTab(t); setError('') }}
                className={cn(
                  'flex-1 py-4 text-sm font-semibold border-b-2 transition-colors',
                  tab === t
                    ? 'border-primary text-primary bg-primary-50/50'
                    : 'border-border text-text-secondary hover:text-text-primary',
                )}>
                {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
              </button>
            ))}
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-accent text-sm rounded-xl border border-red-100">
                {error}
              </div>
            )}

            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                    <input type="email" required placeholder="your@email.com"
                      value={loginData.email}
                      onChange={e => setLoginData(d => ({ ...d, email: e.target.value }))}
                      className="input-base pl-9" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                    <input type={showPass ? 'text' : 'password'} required
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={e => setLoginData(d => ({ ...d, password: e.target.value }))}
                      className="input-base pl-9 pr-10" />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                    Quên mật khẩu?
                  </Link>
                </div>
                <Button type="submit" variant="primary" size="lg"
                  className="w-full" loading={isLoading}>
                  Đăng nhập
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-text-secondary">hoặc tiếp tục với</span>
                  </div>
                </div>
                <Button type="button" variant="outline" size="lg" className="w-full">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Đăng nhập với Google
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Họ và tên</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                    <input type="text" required placeholder="Nguyễn Văn A"
                      value={regData.fullName}
                      onChange={e => setRegData(d => ({ ...d, fullName: e.target.value }))}
                      className="input-base pl-9" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                    <input type="email" required placeholder="your@email.com"
                      value={regData.email}
                      onChange={e => setRegData(d => ({ ...d, email: e.target.value }))}
                      className="input-base pl-9" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Số điện thoại (tùy chọn)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                    <input type="tel" placeholder="0901 234 567"
                      value={regData.phone}
                      onChange={e => setRegData(d => ({ ...d, phone: e.target.value }))}
                      className="input-base pl-9" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                    <input type={showPass ? 'text' : 'password'} required minLength={8}
                      placeholder="Tối thiểu 8 ký tự"
                      value={regData.password}
                      onChange={e => setRegData(d => ({ ...d, password: e.target.value }))}
                      className="input-base pl-9 pr-10" />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" variant="primary" size="lg"
                  className="w-full" loading={isLoading}>
                  Tạo tài khoản
                </Button>
                <p className="text-xs text-center text-text-secondary">
                  Bằng cách đăng ký, bạn đồng ý với{' '}
                  <Link href="/terms" className="text-primary hover:underline">Điều khoản dịch vụ</Link>
                  {' '}và{' '}
                  <Link href="/privacy" className="text-primary hover:underline">Chính sách bảo mật</Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
