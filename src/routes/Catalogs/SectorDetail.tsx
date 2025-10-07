import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import BackButton from '../../components/ui/BackButton'
import { getSector, listAllCases, listCases, listStaff, type ListFilters } from '../../services/oirsRepo'
import SlaChip from '../../components/ui/SlaChip'
import { fmtDate } from '../../utils/date'
import type { OirsCase, Sector, Staff as StaffType } from '../../types/oirs'
import type { DocumentData, DocumentSnapshot } from 'firebase/firestore'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import Card from '../../components/ui/Card'
import TableContainer from '../../components/ui/TableContainer'
import Breadcrumbs from '../../components/ui/Breadcrumbs'
import Button from '../../components/ui/Button'
import Loading from '../../components/ui/Loading'
import EmptyState from '../../components/ui/EmptyState'
import Table from '../../components/Table/Table'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import type { Column } from '../../components/Table/Table'
import { exportCasesToExcel } from '../../utils/exportExcel'

const columns: Column<OirsCase>[] = [
  { key: 'folio', header: 'Folio' },
  {
    key: 'requestType',
    header: 'Tipo',
    render: (r: OirsCase) => r.requestType,
  },
  {
    key: 'intakeChannel',
    header: 'Canal',
    render: (r: OirsCase) => r.intakeChannel,
  },
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

export default function SectorDetail() {
  const { id } = useParams()
  const [sector, setSector] = useState<Sector | null>(null)
  const [rows, setRows] = useState<OirsCase[]>([])
  const [cursor, setCursor] = useState<DocumentSnapshot<DocumentData> | undefined>(undefined)
  const [hasMore, setHasMore] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [staffModalOpen, setStaffModalOpen] = useState(false)
  const [staffLoading, setStaffLoading] = useState(false)
  const [sectorStaff, setSectorStaff] = useState<StaffType[]>([])
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getSector(id).then((data) => {
      setSector(data)
      setLoading(false)
    })
    fetchPage(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function fetchPage(reset = false) {
    setLoading(true)
    if (!id) return
    const filters: Partial<ListFilters> = { sectorId: id }
    if (startDate) filters.receivedFrom = startDate
    if (endDate) filters.receivedTo = endDate
    const page = await listCases(filters, 10, reset ? undefined : cursor)
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
    const sectorSlug = (sector?.name ?? id ?? 'sector')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    return `casos-sector-${sectorSlug}-${suffix}`
  }

  async function handleExport() {
    if (!id) return
    setExporting(true)
    try {
      const filters: Partial<ListFilters> = { sectorId: id }
      if (startDate) filters.receivedFrom = startDate
      if (endDate) filters.receivedTo = endDate
      const cases = await listAllCases(filters)
      const staffList = await listStaff()
      const staffNameById = new Map(
        staffList
          .filter((member): member is StaffType & { id: string } => Boolean(member.id))
          .map((member) => [member.id, member.name || member.email || member.id])
      )
      exportCasesToExcel(cases, {
        filename: buildExportFilename(),
        context: {
          sectorNameById: new Map([[id, sector?.name ?? sector?.code ?? id]]),
          staffNameById,
          staticColumns: {
            'Sector filtrado': sector?.name ?? id,
          },
        },
      })
    } catch (error) {
      console.error('No fue posible exportar los casos del sector', error)
    } finally {
      setExporting(false)
    }
  }

  async function openStaffModal() {
    if (!id) return
    setStaffModalOpen(true)
    setStaffLoading(true)
    setSectorStaff([])
    try {
      const allStaff = await listStaff()
      setSectorStaff(allStaff.filter((member) => (member.sectorIds ?? []).includes(id)))
    } finally {
      setStaffLoading(false)
    }
  }

  function renderStaffList() {
    if (staffLoading) {
      return <Loading text="Cargando funcionarios..." />
    }
    if (sectorStaff.length === 0) {
      return (
        <EmptyState
          title="Sin funcionarios asignados"
          description="Puedes asignarlos desde el detalle del funcionario."
        />
      )
    }

    return (
      <ul className="divide-y divide-slate-100">
        {sectorStaff.map((member) => (
          <li key={member.id} className="py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{member.name}</p>
                <p className="text-xs text-slate-500">{member.email}</p>
                <p className="text-xs text-slate-500">{member.role}</p>
              </div>
              <div className="flex gap-2">
                {member.isChief && <Badge variant="success">Jefe/a</Badge>}
                <Button as={Link} to={`/catalogs/staff/${member.id}`} variant="outline" size="sm">
                  Ver detalle
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  // Actualizar la vista de casos para que sea consistente con `CasesList`
  return (
    <div className="space-y-3">
      <PageHeader
        title={`Sector: ${sector?.name ?? id}`}
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: 'Sectores', to: '/catalogs/sectors' },
              { label: sector?.name ?? id ?? '' },
            ]}
          />
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <BackButton fallback="/catalogs/sectors" />
            <Button
              as={Link}
              to={id ? `/catalogs/sectors/${id}/edit` : undefined}
              variant="primary"
              size="sm"
              disabled={!id}
            >
              Editar sector
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openStaffModal}
              disabled={!id || staffLoading}
              loading={staffLoading}
            >
              Ver funcionarios asignados
            </Button>
          </div>
        }
      />

      <Section title="Filtros" description="Filtra los casos por rango de fechas">
        <Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Modal
                open={staffModalOpen}
                onClose={() => setStaffModalOpen(false)}
                title="Funcionarios asignados"
                size="lg"
                backdrop="blur"
                footer={
                  <div className="flex justify-end">
                    <Button variant="primary" onClick={() => setStaffModalOpen(false)}>
                      Cerrar
                    </Button>
                  </div>
                }
              >
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    {staffLoading
                      ? 'Cargando funcionarios asignados...'
                      : `Este sector tiene ${sectorStaff.length} funcionario(s) asignado(s).`}
                  </p>
                  {renderStaffList()}
                </div>
              </Modal>
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

      <Section title="Casos del sector" description="Listado de casos asociados a este sector">
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
                          <Button as={Link} to={`/cases/${r.id}/edit`} variant="outline" size="sm">
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
  )
}
