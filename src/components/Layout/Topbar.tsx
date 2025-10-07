import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function Topbar() {
  const { user, signOut } = useAuth()
  return (
    <header className="border-b bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/cases" className="font-semibold">
          gestionOIRS
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-gray-600 sm:inline">{user.email}</span>
              <button
                onClick={() => signOut()}
                className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Salir
              </button>
            </>
          ) : (
            <Link
              className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
              to="/login"
            >
              Ingresar
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
