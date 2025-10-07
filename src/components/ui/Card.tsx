import React from 'react'
import { cn } from '../../utils/cn'

const baseClass =
  'rounded-2xl border border-slate-200 bg-white p-5 shadow-elevation1 sm:p-6 motion-safe:transition-shadow hover:shadow-elevation2'

export default function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn(baseClass, className)}>{children}</div>
}
