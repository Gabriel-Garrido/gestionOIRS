import { useEffect, useState } from 'react'
import { listSectors } from '../../services/oirsRepo'
import { Link } from 'react-router-dom'
import type { Sector } from '../../types/oirs'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import Card from '../../components/ui/Card'
import TableContainer from '../../components/ui/TableContainer'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import Loading from '../../components/ui/Loading'
import NewSectorModal from '../../components/NewSectorModal'

export default function Sectors() {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [openNew, setOpenNew] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    listSectors().then((data) => {
      setSectors(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <Loading text="Cargando sectores..." />
  }

  return (
    <div className="mx-auto w-full max-w-page space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Sectores"
        actions={<Button onClick={() => setOpenNew(true)}>Nuevo sector</Button>}
      />

      <Section title="Listado" description="Sectores registrados">
        <Card>
          {sectors.length === 0 ? (
            <EmptyState
              title="Sin sectores"
              description="Agrega el primero usando el botón superior."
            />
          ) : (
            <TableContainer>
              <table className="min-w-full table-auto text-sm">
                <colgroup>
                  <col className="w-[18%]" />
                  <col />
                  <col className="w-[16%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">Nombre</th>
                    <th className="px-3 py-2 text-left">Código</th>
                    <th className="px-3 py-2 text-left">Estado</th>
                    <th className="px-3 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sectors.map((r) => (
                    <tr key={r.id} className="align-middle">
                      <td
                        className="px-3 py-2 font-mono text-xs text-neutral-700 truncate max-w-[12rem]"
                        title={r.id}
                      >
                        {r.id}
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          className="no-underline text-neutral-800 hover:text-neutral-950"
                          to={`/catalogs/sectors/${r.id}`}
                        >
                          {r.name}
                        </Link>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{r.code}</td>
                      <td className="px-3 py-2">
                        <span
                          className={[
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                            r.active
                              ? 'bg-green-50 text-green-700'
                              : 'bg-neutral-100 text-neutral-700',
                          ].join(' ')}
                        >
                          {r.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          as={Link}
                          to={`/catalogs/sectors/${r.id}`}
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-xs"
                        >
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableContainer>
          )}
        </Card>
      </Section>

      <NewSectorModal
        open={openNew}
        onClose={() => setOpenNew(false)}
        onCreated={async () => {
          setOpenNew(false)
          setLoading(true)
          const data = await listSectors()
          setSectors(data)
          setLoading(false)
        }}
      />
    </div>
  )
}
