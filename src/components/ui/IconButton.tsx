import { cn } from '../../utils/cn'

type Variant = 'primary' | 'outline' | 'ghost'

export default function IconButton({
  variant = 'ghost',
  title,
  children,
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  title?: string
  children: React.ReactNode
  className?: string
}) {
  const base =
    'inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 transition-colors focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-55'
  const variants: Record<Variant, string> = {
    ghost: 'hover:bg-slate-100',
    outline: 'border border-slate-300 bg-white hover:bg-slate-50',
    primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-650',
  }

  return (
    <button
      type="button"
      aria-label={title}
      title={title}
      className={cn(base, variants[variant], className)}
      {...rest}
    >
      {children}
    </button>
  )
}
