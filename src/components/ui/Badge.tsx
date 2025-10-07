import React from 'react'

type Variant = 'default' | 'success' | 'warning' | 'destructive' | 'muted'

export default function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode
  variant?: Variant
}) {
  const variants: Record<Variant, string> = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    destructive: 'bg-red-100 text-red-800',
    muted: 'bg-gray-50 text-gray-700',
  }
  return (
    <span
      className={[
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
        variants[variant],
      ].join(' ')}
    >
      {children}
    </span>
  )
}
