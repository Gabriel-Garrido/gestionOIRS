import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getById } from '../../services/firebase/firestore'
import Loading from '../../components/ui/Loading'
type Adj = { name: string; path: string; url: string }
type Sol = {
  id: string
  folio: string
  asunto: string
  detalle: string
  estado: string
  fechaIngreso: Date | { toDate?: () => Date }
  adjuntos?: Adj[]
}

export default function SolicitudDetail() {
  const { id } = useParams()
  const [data, setData] = useState<Sol | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  useEffect(() => {
    if (!id) return
    getById('solicitudes', id).then((d) => {
      setData(d as unknown as Sol)
      setLoading(false)
    })
  }, [id])
  // Mostrar un indicador de carga mientras se cargan los detalles de la solicitud
  if (loading) {
    return <Loading text="Cargando detalles de la solicitud..." />
  }
  if (!data) return <div className="p-6">No encontrado</div>
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Folio {data.folio}</h1>
        <button
          className="text-blue-600 hover:underline"
          onClick={() => {
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1)
            } else {
              navigate('/solicitudes')
            }
          }}
        >
          Volver
        </button>
      </div>
      <div className="rounded border p-4">
        <p className="font-medium">Asunto</p>
        <p>{data.asunto}</p>
      </div>
      <div className="rounded border p-4">
        <p className="font-medium">Detalle</p>
        <p className="whitespace-pre-wrap">{data.detalle}</p>
      </div>
      <div className="rounded border p-4">
        <p className="font-medium">Adjuntos</p>
        <ul className="list-disc pl-5">
          {(data.adjuntos ?? []).map((a) => (
            <li key={a.path}>
              <a className="text-blue-600 hover:underline" href={a.url} target="_blank">
                {a.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
