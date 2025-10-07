import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Icon from '../components/ui/Icon'
import IconButton from '../components/ui/IconButton'
import { useEffect, useMemo, useState } from 'react'
import Navbar, { Brand } from '../components/nav/Navbar'
import type { NavItem } from '../components/nav/Navbar'
import MobileDrawer from '../components/nav/MobileDrawer'

export default function MainLayout() {
  const { user, signOut } = useAuth()
  const [openMenu, setOpenMenu] = useState(false)
  const { pathname } = useLocation()

  const container = 'mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8'

  // Sin dark mode: diseño claro único
  // bloquear scroll del body cuando el menú está abierto (mobile)
  useEffect(() => {
    if (openMenu) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [openMenu])

  const items: NavItem[] = useMemo(
    () => [
      { to: '/cases', label: 'Casos', icon: <Icon name="document" /> },
      { to: '/metrics', label: 'Métricas', icon: <Icon name="chart" /> },
      { to: '/catalogs/sectors', label: 'Sectores', icon: <Icon name="building" /> },
      { to: '/catalogs/staff', label: 'Funcionarios', icon: <Icon name="users" /> },
    ],
    []
  )

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white text-blue-700 px-3 py-1.5 rounded"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-50">
        <div className="backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/90">
          <div
            className={`${container} grid grid-cols-[auto_1fr_auto] items-center gap-4 py-2 sm:py-3`}
          >
            {/* Brand a la izquierda */}
            <div className="flex items-center min-w-[140px]">
              <Brand />
            </div>
            {/* Navbar centrado */}
            <div className="flex justify-center">
              <Navbar items={items} />
            </div>
            {/* Usuario y acciones a la derecha */}
            <div className="flex items-center gap-2 justify-end min-w-[160px]">
              {user ? (
                <span className="hidden truncate text-xs text-gray-600 sm:inline sm:max-w-[14rem] sm:text-sm">
                  {user.email}
                </span>
              ) : (
                <Link
                  className="hidden rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 sm:inline-block sm:text-sm"
                  to="/login"
                >
                  Ingresar
                </Link>
              )}
              <div className="sm:hidden">
                <IconButton
                  aria-label="Abrir menú"
                  title="Abrir menú"
                  className="h-9 w-9 justify-center"
                  aria-expanded={openMenu}
                  aria-controls="mobile-drawer"
                  onClick={() => setOpenMenu((v) => !v)}
                >
                  <Icon name="menu" />
                </IconButton>
              </div>
            </div>
          </div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-neutral-900/10 to-transparent" />
        </div>
        <MobileDrawer id="mobile-drawer" open={openMenu} onClose={() => setOpenMenu(false)}>
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Navegación
          </div>
          <div className="flex flex-col px-1">
            {items.map((it) => {
              const isActive = pathname.startsWith(it.to)
              const base = 'inline-flex items-center gap-2 rounded px-3 py-2.5 text-sm'
              const idle = 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              const active = 'text-blue-700 bg-blue-50'
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={[base, 'no-underline', isActive ? active : idle].join(' ')}
                  onClick={() => setOpenMenu(false)}
                >
                  {it.icon}
                  {it.label}
                </Link>
              )
            })}
          </div>
          <hr className="my-2 border-gray-200" />
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Cuenta
          </div>
          <div className="flex flex-col px-1 pb-2">
            {user ? (
              <>
                <div className="px-3 pb-1 text-xs text-gray-600">{user.email}</div>
                <button
                  type="button"
                  className="inline-flex items-center rounded px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 text-left"
                  onClick={() => {
                    signOut()
                    setOpenMenu(false)
                  }}
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                className="inline-flex items-center gap-2 rounded px-3 py-2.5 text-sm text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                to="/login"
                onClick={() => setOpenMenu(false)}
              >
                <Icon name="document" /> Ingresar
              </Link>
            )}
          </div>
        </MobileDrawer>
      </header>
      <main id="content" className={`flex-1 ${container} py-4 sm:py-6`}>
        <Outlet />
      </main>
      <footer className="border-t px-4 py-3 text-xs text-gray-600 sm:text-sm">
        gestionOIRS © {new Date().getFullYear()}
      </footer>
    </div>
  )
}
