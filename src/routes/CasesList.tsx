import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAllCases, listCases, listSectors, listStaff, type ListFilters } from '../services/oirsRepo'
import type { DocumentData, DocumentSnapshot } from 'firebase/firestore'
import SlaChip from '../components/ui/SlaChip'
import Table, { type Column } from '../components/Table/Table'
import CasesFilters from '../components/Filters/CasesFilters'
import { useQueryParamsFilters } from '../hooks/useQueryParamsFilters'
import { fmtDate, formatDateUtcYmd } from '../utils/date'
import type { OirsCase } from '../types/oirs'
import { intakeChannelLabel, requestTypeLabel } from '../utils/labels'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import Toolbar from '../components/ui/Toolbar'
import TableContainer from '../components/ui/TableContainer'
import EmptyState from '../components/ui/EmptyState'
import StatusBadge from '../components/ui/StatusBadge'
import Loading from '../components/ui/Loading'
import { isWeekendIntl, CL_2025_HOLIDAYS } from '../utils/date'
import Pagination from '../components/ui/Pagination'
import Section from '../components/ui/Section'
import { exportCasesToExcel } from '../utils/exportExcel'

export default function CasesList() {
  // Mes actual por defecto (año/mes separados)
  const now = new Date()
  const defaultYear = String(now.getFullYear())
  const defaultMonth = String(now.getMonth() + 1).padStart(2, '0')
  const { filters, update, reset } = useQueryParamsFilters<
    { year?: string; month?: string } & Partial<ListFilters>
  >({ year: defaultYear, month: defaultMonth }, { storageKey: 'casesFilters' })
  const [rows, setRows] = useState<OirsCase[]>([])
  const [loading, setLoading] = useState(true)
  const [sectors, setSectors] = useState<{ id: string; name: string }[]>([])
  const [cursor, setCursor] = useState<DocumentSnapshot<DocumentData> | undefined>(undefined)
  const [staff, setStaff] = useState<{ id: string; name: string; email?: string }[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 60
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    listSectors().then((s) => setSectors((s ?? []).map((x) => ({ id: x.id ?? '', name: x.name }))))
    listStaff().then((st) =>
      setStaff(
        (st ?? [])
          .filter((x) => x.id)
          .map((x) => ({
            id: x.id as string,
            name: x.name || x.email || (x.id as string),
            email: x.email,
          }))
      )
    )
  }, [])

  function monthRange(yStr?: string, mStr?: string): { from?: string; to?: string } {
    if (!yStr) return {}
    const y = Number.parseInt(yStr, 10)
    if (Number.isNaN(y)) return {}

    if (!mStr || mStr === 'ALL') {
      const fromDate = new Date(Date.UTC(y, 0, 1))
      const toDate = new Date(Date.UTC(y, 11, 31))
      return { from: formatDateUtcYmd(fromDate), to: formatDateUtcYmd(toDate) }
    }

    const m = Number.parseInt(mStr, 10)
    if (Number.isNaN(m)) return {}
    const fromDate = new Date(Date.UTC(y, m - 1, 1))
    const toDate = new Date(Date.UTC(y, m, 0))
    return { from: formatDateUtcYmd(fromDate), to: formatDateUtcYmd(toDate) }
  }

  function buildEffectiveFilters(): Partial<ListFilters> {
    const { from, to } = monthRange(
      filters.year as string | undefined,
      filters.month as string | undefined
    )

    const effectiveFilters: Partial<ListFilters> = {
      ...filters,
      receivedFrom: from,
      receivedTo: to,
    }

    Object.keys(effectiveFilters).forEach((key) => {
      const val = effectiveFilters[key as keyof ListFilters]
      if (val == null || val === '') {
        delete effectiveFilters[key as keyof ListFilters]
      }
    })

    return effectiveFilters
  }

  async function fetchPage() {
    setLoading(true)
    try {
      const effectiveFilters = buildEffectiveFilters()
      const pageData = await listCases(effectiveFilters, pageSize, cursor)
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedItems = pageData.items.slice(startIndex, endIndex)

      setRows(paginatedItems)
      setCursor(pageData.nextCursor)
      setHasMore(pageData.items.length > endIndex)
    } catch (error) {
      console.error('Error al cargar los casos:', error)
      // Aquí puedes agregar lógica para mostrar un mensaje de error al usuario
    } finally {
      setLoading(false)
    }
  }

  function exportFilename(from?: string, to?: string) {
    const today = new Date().toISOString().slice(0, 10)
    if (!from && !to) return `casos-${today}`
    const parts = [from, to]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.slice(0, 10))
    return `casos-${parts.join('_') || today}`
  }

  async function handleExport() {
    setExporting(true)
    try {
      const effectiveFilters = buildEffectiveFilters()
      const cases = await listAllCases(effectiveFilters)
      const sectorNameById = new Map(sectors.map((sector) => [sector.id, sector.name]))
      const staffNameById = new Map(
        staff.map((member) => [member.id, member.name || member.email || member.id])
      )
      const filename = exportFilename(
        effectiveFilters.receivedFrom,
        effectiveFilters.receivedTo
      )
      exportCasesToExcel(cases, {
        filename,
        context: { sectorNameById, staffNameById },
      })
    } catch (error) {
      console.error('No fue posible exportar los casos', error)
    } finally {
      setExporting(false)
    }
  }

  function stepMonth(delta: number) {
    const y = parseInt((filters.year as string) || defaultYear, 10)
    const m = parseInt((filters.month as string) || defaultMonth, 10)
    const d = new Date(y, m - 1, 1)
    d.setMonth(d.getMonth() + delta)
    update({ year: String(d.getFullYear()), month: String(d.getMonth() + 1).padStart(2, '0') })
  }

  // Utilidad: nombre de mes en español en minúsculas
  function monthNameEs(mStr?: string) {
    const list = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ]
    const m = Math.min(12, Math.max(1, parseInt(mStr || defaultMonth, 10)))
    return list[m - 1]
  }

  const titleYear = (filters.year as string) || defaultYear
  const titleMonth =
    !filters.month || filters.month === 'ALL' ? 'todo el año' : monthNameEs(filters.month as string)

  // Subcomponente: Selector de mes reutilizable
  function MonthSelector({ compact = false }: { compact?: boolean }) {
    const baseSel =
      'rounded-lg border border-slate-300 bg-white text-slate-800 transition-shadow focus:outline-hidden focus:ring-3 focus:ring-brand-600/20 focus:border-brand-600'
    const btnBase =
      'inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition-colors focus:outline-hidden focus:ring-3 focus:ring-brand-600/20 hover:border-brand-600 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm px-2'
    const iconSize = 22
    const disabled = filters.month === 'ALL'
    return (
      <div className={['flex items-center gap-2', compact ? '' : ''].join(' ')}>
        {/* Prev */}
        <button
          type="button"
          className={btnBase}
          onClick={() => !disabled && stepMonth(-1)}
          aria-label="Mes anterior"
          disabled={disabled}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            width={iconSize}
            height={iconSize}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <select
          className={[baseSel, compact ? 'h-9 px-3 text-sm w-28' : 'px-3 py-2 text-sm w-28'].join(
            ' '
          )}
          value={(filters.month as string) === 'ALL' ? '' : ((filters.month as string) ?? '')}
          onChange={(e) => update({ month: e.target.value })}
          disabled={disabled}
        >
          <option value="01">Enero</option>
          <option value="02">Febrero</option>
          <option value="03">Marzo</option>
          <option value="04">Abril</option>
          <option value="05">Mayo</option>
          <option value="06">Junio</option>
          <option value="07">Julio</option>
          <option value="08">Agosto</option>
          <option value="09">Septiembre</option>
          <option value="10">Octubre</option>
          <option value="11">Noviembre</option>
          <option value="12">Diciembre</option>
        </select>
        <select
          className={[baseSel, compact ? 'h-9 px-3 text-sm w-24' : 'px-3 py-2 text-sm w-24'].join(
            ' '
          )}
          value={(filters.year as string) ?? ''}
          onChange={(e) => update({ year: e.target.value })}
        >
          {(() => {
            const current = parseInt(defaultYear)
            const start = 2025
            const years: string[] = []
            for (let y = current; y >= start; y--) years.push(String(y))
            return years
          })().map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        {/* Next */}
        <button
          type="button"
          className={btnBase}
          onClick={() => !disabled && stepMonth(1)}
          aria-label="Mes siguiente"
          disabled={disabled}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            width={iconSize}
            height={iconSize}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    )
  }

  useEffect(() => {
    fetchPage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), page])

  function calculateBusinessDaysRemaining(dueDateISO: string): number {
    const today = new Date()
    const dueDate = new Date(dueDateISO)
    let remainingDays = 0

    while (today < dueDate) {
      today.setDate(today.getDate() + 1)
      const ymd = today.toISOString().slice(0, 10)
      if (isWeekendIntl(today)) continue
      if (CL_2025_HOLIDAYS.has(ymd)) continue
      remainingDays++
    }

    return remainingDays
  }

  const columns: Column<OirsCase>[] = [
    {
      key: 'folio',
      header: 'Folio',
      render: (r: OirsCase) => (
        <Link
          to={`/cases/${r.id}`}
          className="text-blue-600 hover:underline font-semibold"
          title="Ver detalle del caso"
        >
          {r.folio || r.id}
        </Link>
      ),
    },
    {
      key: 'requestType',
      header: 'Tipo',
      render: (r) => requestTypeLabel[r.requestType] ?? r.requestType,
    },
    {
      key: 'intakeChannel',
      header: 'Canal',
      render: (r) => intakeChannelLabel[r.intakeChannel] ?? r.intakeChannel,
    },
    {
      key: 'sectorId',
      header: 'Sector',
      render: (r) => sectors.find((s) => s.id === r.sectorId)?.name ?? '—',
    },
    {
      key: 'receivedAt',
      header: 'Recibido',
      render: (r) => fmtDate(r.receivedAt),
    },
    {
      key: 'dueAt',
      header: 'Vence',
      render: (r) => {
        const remainingDays = calculateBusinessDaysRemaining(r.dueAt)
        let rowClass = ''
        let badgeColor = ''

        if (remainingDays > 7) {
          rowClass = 'bg-green-50'
          badgeColor = 'bg-green-500'
        } else if (remainingDays >= 3) {
          rowClass = 'bg-yellow-50'
          badgeColor = 'bg-yellow-500'
        } else {
          rowClass = 'bg-red-50'
          badgeColor = 'bg-red-500'
        }

        return (
          <div className={`relative p-2 rounded ${rowClass} flex items-center justify-between`}>
            <span>{fmtDate(r.dueAt)}</span>
            <span
              className={`inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white ${badgeColor} rounded-full ml-2`}
            >
              {remainingDays}
            </span>
          </div>
        )
      },
    },
    { key: 'sla', header: 'SLA', render: (r) => <SlaChip value={r.sla} /> },
    { key: 'status', header: 'Estado', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: 'Acciones',
      render: (r) => (
        <div className="flex gap-2">
          <Button as={Link} to={`/cases/${r.id}`} variant="outline" size="sm">
            Ver
          </Button>
          <Button as={Link} to={`/cases/${r.id}/edit`} variant="outline" size="sm">
            Editar
          </Button>
          {r.googleDriveFolder ? (
            <Button
              as="a"
              href={r.googleDriveFolder}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              size="sm"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              Drive
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="cursor-not-allowed border-slate-200 text-slate-400"
              disabled
            >
              Drive
            </Button>
          )}
        </div>
      ),
    },
  ]

  // Move the sorting logic outside of JSX to avoid returning void
  rows.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Casos OIRS ${titleMonth} ${titleYear}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              loading={exporting}
              disabled={exporting}
            >
              Descargar Excel
            </Button>
            <Button as={Link} to="/cases/new">
              Nuevo caso
            </Button>
          </div>
        }
      />
      <Section>
        {/* Selector en móvil: visible arriba, separado del botón de filtros */}
        <div className="sm:hidden mb-2 flex items-end justify-between gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Mes</label>
            <MonthSelector compact />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              reset()
            }}
          >
            Limpiar
          </Button>
        </div>
        <Toolbar
          collapsible
          leading={
            <CasesFilters value={filters} onChange={update} sectors={sectors} staff={staff} />
          }
          trailing={
            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Mes</label>
                <MonthSelector />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // limpiar todo y dejar mes/año vigentes
                  reset()
                }}
              >
                Limpiar
              </Button>
            </div>
          }
        />
        {loading && rows.length === 0 ? (
          <Loading text="Cargando casos..." />
        ) : rows.length === 0 ? (
          <EmptyState
            title="Sin resultados"
            description="Ajusta los filtros o crea un nuevo caso."
            action={
              <Button as={Link} to="/cases/new">
                Nuevo caso
              </Button>
            }
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
                        <div className="mt-0.5 line-clamp-2 text-xs text-slate-600">
                          {requestTypeLabel[r.requestType] ?? r.requestType} ·{' '}
                          {intakeChannelLabel[r.intakeChannel] ?? r.intakeChannel}
                        </div>
                        <div className="mt-1 grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                          <div>
                            <div className="text-slate-500">Recibido</div>
                            <div>{fmtDate(r.receivedAt)}</div>
                          </div>
                          <div>
                            <div className="text-slate-500">Vence</div>
                            <div>{fmtDate(r.dueAt)}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-slate-500">Estado</div>
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
          <Pagination
            currentPage={page}
            totalItems={rows.length * (hasMore ? page + 1 : page)}
            pageSize={pageSize}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      </Section>
    </div>
  )
}
