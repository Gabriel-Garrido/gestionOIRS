import { useEffect, useMemo, useState } from 'react'
import { listSectors, listStaff } from '../../services/oirsRepo'
import { Link } from 'react-router-dom'
import type { Sector, Staff as StaffType } from '../../types/oirs'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import Card from '../../components/ui/Card'
import TableContainer from '../../components/ui/TableContainer'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import NewStaffModal from '../../components/NewStaffModal'
import Loading from '../../components/ui/Loading'

export default function Staff() {
  const [rows, setRows] = useState<StaffType[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [openNew, setOpenNew] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  const staffById = useMemo(() => {
    const map = new Map<string, StaffType>()
    rows.forEach((r) => {
      if (r.id) map.set(r.id, r)
    })
    return map
  }, [rows])

  async function load() {
    setLoading(true)
    const [s, st] = await Promise.all([listSectors(), listStaff()])
    setSectors(s)
    setRows(st)
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  const filteredRows = rows.filter((r) => r.name.toLowerCase().includes(searchTerm.toLowerCase()))

  if (loading) {
    return <Loading text="Cargando funcionarios..." />
  }

  return (
    <div className="mx-auto w-full max-w-page space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Funcionarios"
        actions={<Button onClick={() => setOpenNew(true)}>Nuevo funcionario</Button>}
      />

      <Section title="Listado" description="Funcionarios registrados">
        <Card>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar por nombre"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          {filteredRows.length === 0 ? (
            <EmptyState
              title="Sin funcionarios"
              description="Agrega el primero usando el formulario superior."
            />
          ) : (
            <div>
              {/* Mobile: cards */}
              <div className="sm:hidden">
                <ul className="flex flex-col gap-3">
                  {filteredRows.map((r) => {
                    const jefe = r.chiefId ? staffById.get(r.chiefId) : null
                    const sectorLabels = (r.sectorIds ?? [])
                      .map((sid) => sectors.find((s) => s.id === sid)?.name)
                      .filter(Boolean) as string[]
                    return (
                      <li key={r.id} className="rounded-lg border bg-white p-3 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-neutral-900">
                              {r.name}
                            </div>
                            <div className="text-xs text-neutral-600">{r.email ?? '—'}</div>
                            <div className="mt-0.5 text-xs text-neutral-600">
                              {r.isChief ? (
                                <span className="font-medium text-emerald-600">Jefatura</span>
                              ) : (
                                <>
                                  Jefatura:{' '}
                                  <span className="font-medium text-neutral-800">
                                    {jefe ? jefe.name : '—'}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="mt-0.5 text-xs text-neutral-600">
                              Sectores:{' '}
                              <span className="font-medium text-neutral-800">
                                {sectorLabels.length > 0 ? sectorLabels.join(', ') : '—'}
                              </span>
                            </div>
                            <div className="mt-0.5 text-xs text-neutral-600">
                              Rol: <span className="font-medium text-neutral-800">{r.role}</span>
                            </div>
                            <div className="mt-2">
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
                            </div>
                          </div>
                          <Button
                            as={Link}
                            to={`/catalogs/staff/${r.id}`}
                            variant="outline"
                            size="sm"
                            className="h-8 shrink-0 px-2 text-xs"
                          >
                            Ver
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
              {/* Desktop: table */}
              <div className="hidden sm:block">
                <TableContainer className="table-sticky table-zebra">
                  <table className="min-w-full table-auto text-sm">
                    <colgroup>
                      <col />
                      <col className="w-[22%]" />
                      <col className="w-[22%]" />
                      <col className="w-[14%]" />
                      <col className="w-[18%]" />
                      <col className="w-[12%]" />
                      <col className="w-[12%]" />
                    </colgroup>
                    <thead>
                      <tr className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                        <th className="px-3 py-2 text-left">Nombre</th>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-left">Jefatura</th>
                        <th className="px-3 py-2 text-left">Rol</th>
                        <th className="px-3 py-2 text-left">Sector</th>
                        <th className="px-3 py-2 text-left">Estado</th>
                        <th className="px-3 py-2 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((r) => {
                        const jefe = r.chiefId ? staffById.get(r.chiefId) : null
                        const sectorLabels = (r.sectorIds ?? [])
                          .map((sid) => sectors.find((s) => s.id === sid)?.name)
                          .filter(Boolean) as string[]
                        const sectorName = sectorLabels.join(', ')
                        return (
                          <tr key={r.id} className="align-middle">
                            <td className="px-3 py-2">
                              <Link
                                className="no-underline text-neutral-800 hover:text-neutral-950"
                                to={`/catalogs/staff/${r.id}`}
                              >
                                {r.name}
                              </Link>
                            </td>
                            <td className="px-3 py-2 truncate max-w-[16rem]" title={r.email ?? ''}>
                              {r.email ?? '-'}
                            </td>
                            <td className="px-3 py-2 max-w-[16rem]">
                              {r.isChief ? (
                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600 ring-1 ring-emerald-200">
                                  Jefatura
                                </span>
                              ) : jefe ? (
                                <div className="flex flex-col">
                                  <span className="truncate font-medium text-neutral-800">
                                    {jefe.name}
                                  </span>
                                  <span className="truncate text-xs text-neutral-500">
                                    {jefe.email}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-neutral-400">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">{r.role}</td>
                            <td className="px-3 py-2 truncate max-w-[16rem]" title={sectorName}>
                              {sectorName || '—'}
                            </td>
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
                                to={`/catalogs/staff/${r.id}`}
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs"
                              >
                                Ver
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </TableContainer>
              </div>
            </div>
          )}
        </Card>
      </Section>

      <NewStaffModal
        open={openNew}
        onClose={() => setOpenNew(false)}
        onCreated={async () => {
          setOpenNew(false)
          await load()
        }}
      />
    </div>
  )
}
