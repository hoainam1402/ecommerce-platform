/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#0f172a', 50: '#f8fafc', 100: '#f1f5f9', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a' },
        accent:    { DEFAULT: '#f97316', light: '#fed7aa' },
        success:   '#16a34a',
        warning:   '#d97706',
        danger:    '#dc2626',
        surface:   '#f8fafc',
        border:    '#e2e8f0',
        'text-primary':   '#0f172a',
        'text-secondary': '#64748b',
        'text-muted':     '#94a3b8',
      },
      fontFamily: {
        sans:    ['var(--font-body)', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        card:        '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
        'card-hover':'0 10px 40px rgba(0,0,0,.10), 0 2px 8px rgba(0,0,0,.06)',
        soft:        '0 4px 24px rgba(0,0,0,.06)',
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem' },
      animation: {
        'fade-in':    'fadeIn .4s ease both',
        'slide-up':   'slideUp .4s ease both',
        'slide-down': 'slideDown .3s ease both',
        'scale-in':   'scaleIn .2s ease both',
        'spin-slow':  'spin 3s linear infinite',
        shimmer:      'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideDown: { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: 0, transform: 'scale(.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
}
