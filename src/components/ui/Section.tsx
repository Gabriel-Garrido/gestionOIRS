import React from 'react'
import { cn } from '../../utils/cn'

const surfaceClass =
  'rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-elevation1 ring-1 ring-black/5 sm:p-6'

export default function Section({
  title,
  description,
  actions,
  children,
  className = '',
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  const hasHeader = Boolean(title || description || actions)

  return (
    <section className={cn(surfaceClass, className)}>
      {hasHeader && (
        <header className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            {title && (
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">{title}</h2>
            )}
            {description && <p className="text-sm text-slate-600">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn('flex flex-col gap-4', hasHeader ? 'pt-4' : '')}>{children}</div>
    </section>
  )
}
