'use client'
import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        primary:   'bg-primary text-white hover:bg-primary-700 active:scale-[0.98] shadow-sm',
        secondary: 'bg-primary-50 text-primary hover:bg-primary-100 active:scale-[0.98]',
        outline:   'border-2 border-primary text-primary hover:bg-primary-50 active:scale-[0.98]',
        ghost:     'text-text-primary hover:bg-surface active:scale-[0.98]',
        danger:    'bg-accent text-white hover:bg-red-700 active:scale-[0.98]',
        link:      'text-primary underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm:   'h-8  px-3 text-xs',
        md:   'h-10 px-4 text-sm',
        lg:   'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  ),
)
Button.displayName = 'Button'

export { Button, buttonVariants }
