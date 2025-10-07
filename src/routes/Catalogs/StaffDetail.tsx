import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  getStaff,
  listCasesByAllegedStaff,
  listCasesByAllegedStaffAll,
  listSectors,
  listStaff,
  upsertStaff,
} from '../../services/oirsRepo'
import SlaChip from '../../components/ui/SlaChip'
import { fmtDate } from '../../utils/date'
import type { OirsCase, Staff as StaffType, Sector } from '../../types/oirs'
import type { DocumentData, DocumentSnapshot } from 'firebase/firestore'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import Card from '../../components/ui/Card'
import TableContainer from '../../components/ui/TableContainer'
import Breadcrumbs from '../../components/ui/Breadcrumbs'
import Button from '../../components/ui/Button'
import BackButton from '../../components/ui/BackButton'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Loading from '../../components/ui/Loading'
import Table from '../../components/Table/Table'
import Modal from '../../components/ui/Modal'
import { exportCasesToExcel } from '../../utils/exportExcel'

export default function StaffDetail() {
  const { id } = useParams()
  const [staff, setStaff] = useState<StaffType | null>(null)
  const [rows, setRows] = useState<OirsCase[]>([])
  const [cursor, setCursor] = useState<DocumentSnapshot<DocumentData> | undefined>(undefined)
  const [hasMore, setHasMore] = useState(false)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [sectors, setSectors] = useState<Sector[]>([])
  const [showSectorModal, setShowSectorModal] = useState(false)
  const [sectorSelection, setSectorSelection] = useState<string[]>([])
  const [updatingSectors, setUpdatingSectors] = useState(false)
  const [chief, setChief] = useState<StaffType | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getStaff(id).then(async (st) => {
      setStaff(st)
      setLoading(false)
    })
    fetchPage(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    listSectors().then((data) => setSectors(data))
  }, [])

  useEffect(() => {
    if (!staff?.chiefId) {
      setChief(null)
      return
    }
    let active = true
    getStaff(staff.chiefId).then((data) => {
      if (active) setChief(data)
    })
    return () => {
      active = false
    }
  }, [staff?.chiefId])

  const availableSectors = useMemo(
    () => sectors.filter((s): s is Sector & { id: string } => Boolean(s.id)),
    [sectors]
  )

  const sectorBadges = useMemo(
    () =>
      (staff?.sectorIds ?? [])
        .map((sid) => availableSectors.find((s) => s.id === sid))
        .filter((value): value is Sector & { id: string } => Boolean(value)),
    [staff?.sectorIds, availableSectors]
  )

  const unknownSectorIds = useMemo(
    () =>
      (staff?.sectorIds ?? []).filter(
        (sid) => !availableSectors.some((sector) => sector.id === sid)
      ),
    [staff?.sectorIds, availableSectors]
  )

  async function saveSectors(nextSectorIds: string[]) {
    if (!staff || !id) return
    setUpdatingSectors(true)
    try {
      await upsertStaff({
        id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        sectorIds: nextSectorIds,
        active: staff.active,
        isChief: staff.isChief,
        chiefId: staff.isChief ? null : (staff.chiefId ?? null),
      })
      const fresh = await getStaff(id)
      setStaff(fresh)
      setShowSectorModal(false)
    } finally {
      setUpdatingSectors(false)
    }
  }

  async function fetchPage(reset = false) {
    setLoading(true)
    if (!id) return

    const filters: any = { staffId: id }
    if (startDate) filters.startDate = startDate
    if (endDate) filters.endDate = endDate

    const page = await listCasesByAllegedStaff(filters, 10, reset ? undefined : cursor)
    setRows((prev) => (reset ? page.items : [...prev, ...page.items]))
    setCursor(page.nextCursor)
    setHasMore(!!page.nextCursor)
    setLoading(false)
  }

  function buildExportFilename() {
    const today = new Date().toISOString().slice(0, 10)
    const parts = [startDate, endDate]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.slice(0, 10))
    const suffix = parts.length > 0 ? parts.join('_') : today
    return `casos-funcionario-${(staff?.name ?? id ?? 'sin-nombre')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}-${suffix}`
  }

  async function handleExport() {
    if (!id) return
    setExporting(true)
    try {
      const filters: { staffId: string; startDate?: string; endDate?: string } = { staffId: id }
      if (startDate) filters.startDate = startDate
      if (endDate) filters.endDate = endDate
      const cases = await listCasesByAllegedStaffAll(filters)
      const staffList = await listStaff()
      const staffNameById = new Map(
        staffList
          .filter((member): member is StaffType & { id: string } => Boolean(member.id))
          .map((member) => [member.id, member.name || member.email || member.id])
      )
      const sectorNameById = new Map(
        availableSectors
          .filter((sector): sector is Sector & { id: string } => Boolean(sector.id))
          .map((sector) => [sector.id, sector.name ?? sector.code ?? sector.id])
      )
      exportCasesToExcel(cases, {
        filename: buildExportFilename(),
        context: {
          sectorNameById,
          staffNameById,
          staticColumns: {
            'Funcionario filtrado': staff?.name ?? id,
          },
        },
      })
    } catch (error) {
      console.error('No fue posible exportar los casos del funcionario', error)
    } finally {
      setExporting(false)
    }
  }

  const columns = [
    { key: 'folio', header: 'Folio' },
    { key: 'requestType', header: 'Tipo' },
    { key: 'intakeChannel', header: 'Canal' },
    { key: 'receivedAt', header: 'Recibido', render: (r: OirsCase) => fmtDate(r.receivedAt) },
    { key: 'dueAt', header: 'Vence', render: (r: OirsCase) => fmtDate(r.dueAt) },
    { key: 'sla', header: 'SLA', render: (r: OirsCase) => <SlaChip value={r.sla} /> },
    { key: 'status', header: 'Estado', render: (r: OirsCase) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: 'Acciones',
      render: (r: OirsCase) => (
        <div className="flex gap-2">
          <Button as={Link} to={`/cases/${r.id}`} variant="outline" size="sm">
            Ver
          </Button>
          <Button as={Link} to={`/cases/${r.id}/edit`} variant="outline" size="sm">
            Editar
          </Button>
        </div>
      ),
    },
  ]

  if (loading) {
    return <Loading text="Cargando datos del funcionario..." />
  }

  return (
    <>
      <div className="space-y-3">
        <PageHeader
          title={`Funcionario: ${staff?.name ?? id}`}
          breadcrumbs={
            <Breadcrumbs
              items={[
                { label: 'Funcionarios', to: '/catalogs/staff' },
                { label: staff?.name ?? id ?? '' },
              ]}
            />
          }
          actions={
            <div className="flex gap-2">
              <BackButton fallback="/catalogs/staff" />
              <Button as={Link} to={`/catalogs/staff/${id}/edit`} variant="primary" size="sm">
                Editar datos
              </Button>
            </div>
          }
        />

        <Section
          title="Detalles del Funcionario"
          description="Información general sobre el funcionario"
        >
          <Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <p className="mt-1 text-sm text-gray-900">{staff?.name ?? '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{staff?.email ?? '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Es jefe/a</label>
                <p className="mt-1 text-sm text-gray-900">{staff?.isChief ? 'Sí' : 'No'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rol</label>
                <p className="mt-1 text-sm text-gray-900">{staff?.role ?? '—'}</p>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Sectores asignados
                </label>
                {sectorBadges.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {sectorBadges.map((sector) => (
                      <span
                        key={sector.id}
                        className="inline-flex items-center rounded-full bg-slate-100 px-3 py-0.5 text-sm text-slate-700"
                      >
                        {sector.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">Sin sectores asignados.</p>
                )}
                {unknownSectorIds.length > 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    Hay {unknownSectorIds.length} identificador(es) sin coincidencia en el catálogo:{' '}
                    {unknownSectorIds.join(', ')}
                  </p>
                )}
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSectorSelection(staff?.sectorIds ?? [])
                      setShowSectorModal(true)
                    }}
                  >
                    Editar sectores
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <p className="mt-1 text-sm text-gray-900">
                  {staff?.active ? 'Activo' : 'Inactivo'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Jefatura asignada</label>
                {chief ? (
                  <div className="mt-1 flex flex-col text-sm text-gray-900">
                    <Link
                      to={`/catalogs/staff/${chief.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {chief.name}
                    </Link>
                    <span className="text-xs text-gray-600">{chief.email}</span>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">—</p>
                )}
              </div>
            </div>
          </Card>
        </Section>

        <Section title="Filtros" description="Filtra los casos por rango de fechas">
          <Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => fetchPage(true)}>
                Aplicar filtros
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={exporting}
                loading={exporting}
              >
                Descargar Excel
              </Button>
            </div>
          </Card>
        </Section>

        <Section
          title="Casos aludidos"
          description="Listado de casos donde el funcionario es aludido"
        >
          {loading && rows.length === 0 ? (
            <Loading text="Cargando casos..." />
          ) : rows.length === 0 ? (
            <EmptyState
              title="Sin resultados"
              description="Ajusta los filtros o crea un nuevo caso."
            />
          ) : (
            <div>
              {/* Mobile: cards */}
              <div className="sm:hidden">
                <ul className="flex flex-col gap-3">
                  {rows.map((r) => (
                    <li key={r.id} className="rounded-md border bg-white p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <span>Folio {r.folio || r.id}</span>
                            <SlaChip value={r.sla} />
                          </div>
                          <div className="mt-0.5 line-clamp-2 text-xs text-gray-600">
                            {r.requestType} · {r.intakeChannel}
                          </div>
                          <div className="mt-1 grid grid-cols-2 gap-2 text-[11px] text-gray-700">
                            <div>
                              <div className="text-gray-500">Recibido</div>
                              <div>{fmtDate(r.receivedAt)}</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Vence</div>
                              <div>{fmtDate(r.dueAt)}</div>
                            </div>
                            <div className="col-span-2">
                              <div className="text-gray-500">Estado</div>
                              <div className="mt-0.5">
                                <StatusBadge status={r.status} />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <div className="flex flex-col items-end gap-2">
                            <Button as={Link} to={`/cases/${r.id}`} variant="outline" size="sm">
                              Ver
                            </Button>
                            <Button
                              as={Link}
                              to={`/cases/${r.id}/edit`}
                              variant="outline"
                              size="sm"
                            >
                              Editar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Desktop: table */}
              <div className="hidden sm:block">
                <TableContainer>
                  <Table columns={columns} rows={rows} />
                </TableContainer>
              </div>
            </div>
          )}
          <div className="flex justify-center p-2">
            {hasMore && (
              <Button variant="outline" size="sm" onClick={() => fetchPage(false)}>
                Cargar más
              </Button>
            )}
          </div>
        </Section>
      </div>

      <Modal
        open={showSectorModal}
        onClose={() => {
          if (updatingSectors) return
          setShowSectorModal(false)
        }}
        title="Asignar sectores"
        size="md"
        backdrop="blur"
        closeOnOverlayClick={!updatingSectors}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSectorModal(false)}
              disabled={updatingSectors}
            >
              Cancelar
            </Button>
            <Button onClick={() => saveSectors(sectorSelection)} disabled={updatingSectors}>
              {updatingSectors ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {availableSectors.length === 0 ? (
            <p className="text-sm text-gray-600">
              No hay sectores disponibles. Crea un sector en el catálogo para poder asignarlo.
            </p>
          ) : (
            <ul className="space-y-2">
              {availableSectors.map((sector) => {
                const value = sector.id
                const checked = sectorSelection.includes(value)
                return (
                  <li key={value}>
                    <label className="flex items-center gap-3 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={checked}
                        onChange={(e) => {
                          setSectorSelection((prev) => {
                            if (e.target.checked) {
                              return prev.includes(value) ? prev : [...prev, value]
                            }
                            return prev.filter((id) => id !== value)
                          })
                        }}
                        disabled={updatingSectors}
                      />
                      <span>{sector.name}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="text-xs text-gray-500">
            Puedes dejar el funcionario sin sectores asignados temporalmente.
          </p>
        </div>
      </Modal>
    </>
  )
}
