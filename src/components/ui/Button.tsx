import React from 'react'
import { cn } from '../../utils/cn'

export type Variant = 'primary' | 'outline' | 'ghost' | 'link' | 'success' | 'warning' | 'danger'
export type Size = 'sm' | 'md'

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-55'

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white shadow-elevation1 hover:bg-brand-650',
  outline:
    'border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
  link: 'bg-transparent px-0 font-medium text-brand-600 underline-offset-4 hover:text-brand-700 hover:underline rounded-none border-none focus-visible:ring-offset-0',
  success: 'bg-success-600 text-white shadow-sm hover:bg-success-700 active:scale-98',
  warning: 'bg-warning-600 text-white shadow-sm hover:bg-warning-700 active:scale-98',
  danger: 'bg-danger-600 text-white shadow-sm hover:bg-danger-700 active:scale-98',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs font-medium sm:text-sm',
  md: 'h-10 px-4 text-sm',
}

const linkSizeClasses: Record<Size, string> = {
  sm: 'h-auto px-0 text-sm font-medium',
  md: 'h-auto px-0 text-base font-medium',
}

export function buttonVariants({
  variant = 'primary',
  size = 'md',
  block = false,
}: {
  variant?: Variant
  size?: Size
  block?: boolean
} = {}) {
  const sizeClass = variant === 'link' ? linkSizeClasses[size] : sizeClasses[size]
  return cn(baseClasses, variantClasses[variant], sizeClass, block && 'w-full')
}

type ButtonOwnProps = {
  variant?: Variant
  size?: Size
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  loading?: boolean
  block?: boolean
  as?: React.ElementType
  to?: string
}

export type ButtonProps = ButtonOwnProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement>

const LoadingSpinner = () => (
  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
)

export default function Button({
  as,
  variant = 'primary',
  size = 'md',
  className,
  leftIcon,
  rightIcon,
  children,
  loading = false,
  block = false,
  disabled,
  type,
  ...rest
}: ButtonProps) {
  const Component = (as ?? 'button') as React.ElementType
  const composedClassName = cn(buttonVariants({ variant, size, block }), className)
  const isButtonElement = Component === 'button'
  const isDisabled = disabled ?? loading

  const componentProps: Record<string, unknown> = {
    ...rest,
    className: composedClassName,
    'data-variant': variant,
    'data-size': size,
    'data-loading': loading ? 'true' : undefined,
  }

  if (isButtonElement) {
    componentProps.type = type ?? 'button'
    componentProps.disabled = isDisabled
  } else if (isDisabled) {
    componentProps['aria-disabled'] = true
  }

  return (
    <Component {...componentProps}>
      {loading ? (
        <LoadingSpinner />
      ) : leftIcon ? (
        <span className="shrink-0" aria-hidden>
          {leftIcon}
        </span>
      ) : null}
      <span className="truncate">{children}</span>
      {rightIcon ? (
        <span className="shrink-0" aria-hidden>
          {rightIcon}
        </span>
      ) : null}
    </Component>
  )
}
