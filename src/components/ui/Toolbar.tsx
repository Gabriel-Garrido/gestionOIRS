import { useState } from 'react'
import { cn } from '../../utils/cn'
import Button from './Button'

export default function Toolbar({
  leading,
  trailing,
  children,
  className = '',
  collapsible = false,
  collapsedLabel = 'Mostrar filtros',
}: {
  leading?: React.ReactNode
  trailing?: React.ReactNode
  children?: React.ReactNode
  className?: string
  collapsible?: boolean
  collapsedLabel?: string
}) {
  const [open, setOpen] = useState(!collapsible)

  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-elevation1 ring-1 ring-black/5 sm:p-5',
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
        <div className="flex flex-wrap items-center gap-2">
          {!collapsible ? (
            (leading ?? children)
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="sm:hidden"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {collapsedLabel}
            </Button>
          )}
        </div>
        <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-2">{trailing}</div>
      </div>
      {collapsible ? (
        <div className={cn(open ? 'block' : 'hidden', 'sm:block')}>
          <div className="mt-1 flex flex-wrap items-center gap-2 sm:mt-0">
            {leading ?? children}
          </div>
        </div>
      ) : null}
      {!collapsible ? (
        <div className="flex flex-wrap items-center gap-2 sm:hidden">{trailing}</div>
      ) : null}
    </div>
  )
}
