import { useEffect, useState } from 'react'
import { getAll } from '../../services/firebase/firestore'
import { Link } from 'react-router-dom'
import Loading from '../../components/ui/Loading'

type Adj = { name: string; path: string; url: string; size?: number }
type Sol = {
  id: string
  folio: string
  asunto: string
  detalle: string
  tipo: string
  estado: string
  fechaIngreso: Date | { toDate?: () => Date }
  adjuntos?: Adj[]
}

export default function ListSolicitudes() {
  const [items, setItems] = useState<Sol[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    getAll('solicitudes').then((d) => {
      const cast = (d as unknown as Array<Record<string, unknown>>).map((x) => x as unknown as Sol)
      setItems(cast)
      setLoading(false)
    })
  }, [])
  // Mostrar un indicador de carga mientras se cargan las solicitudes
  if (loading) {
    return <Loading text="Cargando solicitudes..." />
  }
  const fmtFecha = (d: Date | { toDate?: () => Date }) => {
    const maybe = d as { toDate?: () => Date }
    const dt = typeof maybe.toDate === 'function' ? maybe.toDate!() : (d as Date)
    return dt.toLocaleString()
  }
  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Solicitudes</h1>
        <Link
          to="/solicitudes/nueva"
          className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
        >
          Nueva
        </Link>
      </div>
      <div className="grid gap-3">
        {items.length === 0 && <p>No hay solicitudes.</p>}
        {items.map((s) => (
          <Link
            key={s.id}
            to={`/solicitudes/${s.id}`}
            className="rounded border p-4 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{s.asunto}</p>
                <p className="text-sm text-gray-600">
                  Folio: {s.folio} — Estado: {s.estado}
                </p>
              </div>
              <span className="text-sm text-gray-500">{fmtFecha(s.fechaIngreso)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
