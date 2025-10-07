import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

export type Crumb = { label: string; to?: string }

export default function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1 text-xs text-slate-500', className)}
    >
      {items.map((it, i) => (
        <span
          key={i}
          className="inline-flex max-w-[12rem] items-center gap-1 truncate sm:max-w-none"
        >
          {it.to ? (
            <Link
              to={it.to}
              className="truncate text-slate-500 underline-offset-4 transition hover:text-slate-800"
            >
              {it.label}
            </Link>
          ) : (
            <span className="truncate text-slate-800">{it.label}</span>
          )}
          {i < items.length - 1 && <span className="text-slate-300">/</span>}
        </span>
      ))}
    </nav>
  )
}
