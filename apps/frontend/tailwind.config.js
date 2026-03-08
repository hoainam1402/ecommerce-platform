/** @type {import('tailwindcss').Config} */

const config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1F4E79',
          light:   '#2E86C1',
          50:      '#EBF5FB',
          100:     '#D6EAF8',
          200:     '#AED6F1',
          500:     '#2E86C1',
          600:     '#1F4E79',
          700:     '#1A4068',
          900:     '#0D2137',
        },
        accent:   '#E74C3C',
        success:  '#27AE60',
        warning:  '#F39C12',
        surface:  '#F8F9FA',
        border:   '#DEE2E6',
        text: {
          primary:   '#212529',
          secondary: '#6C757D',
          on_primary: '#FFFFFF',
        },
      },
      fontFamily: {
        sans:    ['var(--font-be-vietnam)', 'sans-serif'],
        display: ['var(--font-plus-jakarta)', 'sans-serif'],
        mono:    ['var(--font-jetbrains-mono)', 'monospace'],
      },
      fontSize: {
        'price':  ['1.25rem', { lineHeight: '1.5', fontWeight: '700' }],
        'price-sm': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
      },
      boxShadow: {
        'card':  '0 2px 8px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.12)',
        'dropdown': '0 4px 20px rgba(0,0,0,0.12)',
      },
      borderRadius: {
        'card': '12px',
      },
      transitionDuration: {
        'DEFAULT': '200ms',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'skeleton': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
      },
      animation: {
        'fade-in':        'fade-in 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'skeleton':       'skeleton 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

module.exports = config