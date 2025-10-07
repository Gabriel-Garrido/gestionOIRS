import React from 'react'
import { cn } from '../../utils/cn'

const baseClass =
  'overflow-x-auto rounded-3xl border border-slate-200 bg-white/95 shadow-elevation1 ring-1 ring-black/5'

export default function TableContainer({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn(baseClass, className)}>{children}</div>
}
