import { Link, useLocation } from 'react-router-dom'
import { useMemo } from 'react'

export type NavItem = {
  to: string
  label: string
  icon?: React.ReactNode
  matchPrefix?: boolean
  external?: boolean
}

export default function Navbar({ items }: { items: NavItem[] }) {
  const { pathname } = useLocation()
  const content = useMemo(() => {
    const base =
      'inline-flex items-center gap-3 rounded-2xl px-4 py-2 text-base font-semibold tracking-tight no-underline transition-all duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white shadow-sm'
    const idle = 'text-neutral-700 hover:text-cyan-600 bg-transparent hover:bg-cyan-50'
    const active = 'text-cyan-700 bg-cyan-100 shadow-md'
    return items.map(({ to, label, icon, matchPrefix = true, external }) => {
      const isActive = matchPrefix ? pathname.startsWith(to) : pathname === to
      const className = [base, isActive ? active : idle].join(' ')
      return external ? (
        <a
          key={to}
          href={to}
          target="_blank"
          rel="noreferrer"
          className={className}
          aria-current={isActive ? 'page' : undefined}
        >
          {icon && <span className="text-xl">{icon}</span>}
          <span>{label}</span>
        </a>
      ) : (
        <Link key={to} to={to} className={className} aria-current={isActive ? 'page' : undefined}>
          {icon && <span className="text-xl">{icon}</span>}
          <span>{label}</span>
        </Link>
      )
    })
  }, [items, pathname])

  return (
    <nav
      className="hidden sm:flex flex-1 items-center justify-center gap-2 bg-white/80 backdrop-blur-md rounded-2xl px-4 py-2"
      style={{ minHeight: 56 }}
      aria-label="Navegación principal"
    >
      {content}
    </nav>
  )
}

export function Brand() {
  return (
    <Link
      className="group inline-flex items-center gap-2 rounded-xl p-1.5 no-underline focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-offset-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-white"
      to="/cases"
    >
      <span
        aria-hidden
        className="inline-grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-white shadow-md ring-1 ring-black/10"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 12l2 2 4-4" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </span>
      <span className="text-base font-semibold tracking-tight text-neutral-900">gestionOIRS</span>
      <span className="sr-only">Ir al inicio</span>
    </Link>
  )
}
