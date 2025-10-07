import React from 'react'
import { cn } from '../../utils/cn'

const surfaceClass =
  'rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-elevation1 ring-1 ring-black/5 sm:p-6'

const columnClass: Record<1 | 2 | 3, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
}

export default function FormSection({
  title,
  description,
  columns = 1,
  children,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  columns?: 1 | 2 | 3
  children: React.ReactNode
}) {
  return (
    <section className={surfaceClass}>
      {(title || description) && (
        <header className="mb-5 space-y-1">
          {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
          {description && <p className="text-sm text-slate-600">{description}</p>}
        </header>
      )}
      <div className={cn('grid gap-4', columnClass[columns])}>{children}</div>
    </section>
  )
}
