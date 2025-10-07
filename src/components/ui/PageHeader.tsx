import React from 'react'
import { cn } from '../../utils/cn'

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  breadcrumbs?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-3xl bg-white/80 px-5 py-4 shadow-elevation1 ring-1 ring-slate-200/65 sm:flex-row sm:items-center sm:justify-between sm:px-6',
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        {breadcrumbs && (
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {breadcrumbs}
          </div>
        )}
        <h1 className="text-xl font-semibold leading-tight text-slate-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>}
    </div>
  )
}
