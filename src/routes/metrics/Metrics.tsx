import { useEffect, useMemo, useState } from 'react'
import MetricsFilters, {
	type MetricsFilterValue,
} from '../../components/Filters/MetricsFilters'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import { exportCasesToExcel } from '../../utils/exportExcel'
import Card from '../../components/ui/Card'
import Loading from '../../components/ui/Loading'
import { fetchMetrics, type MetricsResult } from '../../services/metrics'
import { listSectors, listStaff } from '../../services/oirsRepo'
import {
	ResponsiveContainer,
	LineChart,
	Line,
	CartesianGrid,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
} from 'recharts'

type ChartKey = 'trend' | 'status' | 'requestType' | 'sla' | 'sector' | 'intake'

const CHART_LABELS: Record<ChartKey, string> = {
	trend: 'Tendencia mensual',
	status: 'Distribución por estado',
	requestType: 'Tipos de solicitud',
	sla: 'Estado SLA',
	sector: 'Casos por sector',
	intake: 'Canales de ingreso',
}

const CHART_COLORS = ['#0ea5e9', '#6366f1', '#22c55e', '#f97316', '#ef4444', '#14b8a6', '#a855f7']

const numberFormat = new Intl.NumberFormat('es-CL')

const defaultEnabledCharts: ChartKey[] = ['trend', 'status', 'requestType', 'sla', 'sector', 'intake']

export default function Metrics() {
	const [filters, setFilters] = useState<MetricsFilterValue>(() => createDefaultFilters())
	const [metrics, setMetrics] = useState<MetricsResult | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [sectors, setSectors] = useState<{ id: string; name: string }[]>([])
	const [enabledCharts, setEnabledCharts] = useState<ChartKey[]>(defaultEnabledCharts)
	const [exporting, setExporting] = useState(false)
	const [staff, setStaff] = useState<{ id: string; name: string }[]>([])

	useEffect(() => {
		let active = true
		listSectors()
			.then((response) => {
				if (!active) return
				setSectors(
					(response ?? []).map((sector) => ({
						id: sector.id ?? '',
						name: sector.name || sector.code || 'Sin nombre',
					}))
				)
			})
			.catch((err) => {
				console.error('No fue posible cargar los sectores', err)
			})
		return () => {
			active = false
		}
	}, [])

	useEffect(() => {
		let active = true
		listStaff()
			.then((response) => {
				if (!active) return
				const mapped = (response ?? []).reduce<{ id: string; name: string }[]>((acc, member) => {
					if (!member.id) return acc
					acc.push({ id: member.id, name: member.name || member.email || member.id })
					return acc
				}, [])
				setStaff(mapped)
			})
			.catch((err) => {
				console.error('No fue posible cargar los funcionarios', err)
			})
		return () => {
			active = false
		}
	}, [])

	useEffect(() => {
		let active = true
		setLoading(true)
		setError(null)
		fetchMetrics(filters)
			.then((result) => {
				if (!active) return
				setMetrics(result)
			})
			.catch((err) => {
				if (!active) return
				console.error('Error al cargar métricas', err)
				setMetrics(null)
				setError(err instanceof Error ? err.message : 'Error desconocido')
			})
			.finally(() => {
				if (!active) return
				setLoading(false)
			})

		return () => {
			active = false
		}
	}, [filters])

	const sectorLabelById = useMemo(() => {
		return new Map(sectors.map((sector) => [sector.id, sector.name]))
	}, [sectors])

	const staffNameById = useMemo(() => {
		return new Map(staff.map((member) => [member.id, member.name]))
	}, [staff])

	const monthlyTrendData = useMemo(() => {
		if (!metrics) return []
		const monthFormatter = new Intl.DateTimeFormat('es-CL', {
			month: 'short',
			year: 'numeric',
		})
		return metrics.monthlyTrend.map((item) => ({
			key: item.monthKey,
			label: capitalize(monthFormatter.format(item.date)),
			cases: item.cases,
			responded: item.responded,
			avgResponseDays: item.avgResponseDays,
		}))
	}, [metrics])

	const byStatusData = useMemo(() => metrics?.byStatus ?? [], [metrics])
	const byRequestTypeData = useMemo(() => metrics?.byRequestType ?? [], [metrics])
	const bySlaData = useMemo(() => metrics?.bySla ?? [], [metrics])
	const bySectorData = useMemo(() => {
		if (!metrics) return []
		return metrics.bySector.map((entry) => ({
			...entry,
			label: sectorLabelById.get(entry.sectorId) ?? 'Sin sector',
		}))
	}, [metrics, sectorLabelById])
	const byIntakeData = useMemo(() => metrics?.byIntakeChannel ?? [], [metrics])

	const totals = metrics?.totals

	function handleFiltersChange(next: MetricsFilterValue) {
		setFilters(next)
	}

	function handleResetFilters() {
		setFilters(createDefaultFilters())
	}

	function toggleChart(key: ChartKey) {
		setEnabledCharts((prev) =>
			prev.includes(key) ? prev.filter((chart) => chart !== key) : [...prev, key]
		)
	}

	function isChartEnabled(key: ChartKey) {
		return enabledCharts.includes(key)
	}

	const canExport = Boolean(metrics && metrics.rows.length > 0)

	function buildExportFilename() {
		const today = new Date().toISOString().slice(0, 10)
		const parts = [filters.startDate, filters.endDate]
			.filter((value): value is string => Boolean(value))
			.map((value) => value.slice(0, 10))
		const suffix = parts.length > 0 ? parts.join('_') : today
		return `casos-metricas-${suffix}`
	}

	function handleExport() {
		if (!metrics) return
		setExporting(true)
		try {
			const cases = metrics.rows.map((row) => row.raw)
			exportCasesToExcel(cases, {
				filename: buildExportFilename(),
				context: {
					sectorNameById: sectorLabelById,
					staffNameById,
					staticColumns: {
						Origen: 'Métricas',
					},
				},
			})
		} catch (exportError) {
			console.error('No fue posible exportar las métricas', exportError)
		} finally {
			setExporting(false)
		}
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Métricas OIRS"
				subtitle="Analiza el desempeño de los casos, tiempos de respuesta y canales de ingreso."
				actions={
					<Button
						variant="outline"
						onClick={handleExport}
						disabled={!canExport || exporting}
						loading={exporting}
					>
						Descargar Excel
					</Button>
				}
			/>

			<MetricsFilters
				value={filters}
				onChange={handleFiltersChange}
				onReset={handleResetFilters}
				sectors={sectors}
			/>

			<Card>
				<h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
					Tableros visibles
				</h2>
				<p className="mt-1 text-sm text-slate-600">
					Activa o desactiva los paneles según las métricas que necesites analizar.
				</p>
				<div className="mt-4 flex flex-wrap gap-3">
					{(Object.keys(CHART_LABELS) as ChartKey[]).map((key) => {
						const id = `chart-${key}`
						return (
							<label
								key={key}
								htmlFor={id}
								className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:border-slate-300 hover:bg-slate-50"
							>
								<input
									id={id}
									type="checkbox"
									className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
									checked={isChartEnabled(key)}
									onChange={() => toggleChart(key)}
								/>
								<span className="text-slate-700">{CHART_LABELS[key]}</span>
							</label>
						)
					})}
				</div>
			</Card>

			{loading && <Loading text="Calculando métricas…" />}

			{error && (
				<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
					{error}
				</div>
			)}

			{metrics && !loading ? (
				<div className="space-y-6">
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
						<KpiCard title="Casos analizados" value={totals?.totalCases ?? 0} />
						<KpiCard title="Casos respondidos" value={totals?.respondedCases ?? 0} />
						<KpiCard title="Casos abiertos" value={totals?.openCases ?? 0} />
						<KpiCard
							title="Tiempo medio de respuesta"
							value={formatDays(totals?.averageResponseDays)}
							subtitle={formatMedian(totals?.medianResponseDays)}
						/>
					</div>

					<div className="grid gap-6 xl:grid-cols-2">
						{isChartEnabled('trend') && (
							<ChartCard title={CHART_LABELS.trend} description="Casos recibidos vs. respondidos por mes.">
								<ResponsiveContainer width="100%" height={320}>
									<LineChart data={monthlyTrendData}>
										<CartesianGrid strokeDasharray="3 3" stroke="#cbd5f5" />
										<XAxis dataKey="label" stroke="#94a3b8" />
										<YAxis allowDecimals={false} stroke="#94a3b8" />
										<Tooltip formatter={(value: number) => numberFormat.format(value)} />
										<Legend />
										<Line type="monotone" dataKey="cases" name="Casos" stroke="#0ea5e9" />
										<Line type="monotone" dataKey="responded" name="Respondidos" stroke="#22c55e" />
									</LineChart>
								</ResponsiveContainer>
							</ChartCard>
						)}

						{isChartEnabled('status') && (
							<ChartCard
								title={CHART_LABELS.status}
								description="Estados actuales de los casos filtrados."
							>
								<ResponsiveContainer width="100%" height={320}>
									<BarChart data={byStatusData}>
										<CartesianGrid strokeDasharray="3 3" stroke="#cbd5f5" />
										<XAxis dataKey="status" stroke="#94a3b8" tickFormatter={capitalize} />
										<YAxis allowDecimals={false} stroke="#94a3b8" />
										<Tooltip formatter={(value: number) => numberFormat.format(value)} />
										<Bar dataKey="count" fill="#6366f1" name="Casos" />
									</BarChart>
								</ResponsiveContainer>
							</ChartCard>
						)}

						{isChartEnabled('requestType') && (
							<ChartCard
								title={CHART_LABELS.requestType}
								description="Distribución por tipo de solicitud."
							>
								<ResponsiveContainer width="100%" height={320}>
									<PieChart>
										<Pie
											data={byRequestTypeData}
											dataKey="count"
											nameKey="requestType"
											cx="50%"
											cy="50%"
											outerRadius={110}
																							label={({ payload }) => {
																								const entry = payload as { requestType: string; count: number }
																								return `${capitalize(entry.requestType)} (${entry.count})`
																							}}
										>
											{byRequestTypeData.map((entry, index) => (
												<Cell key={entry.requestType} fill={CHART_COLORS[index % CHART_COLORS.length]} />
											))}
										</Pie>
										<Tooltip
											formatter={(value: number, _name, payload) => [
												numberFormat.format(value),
												capitalize((payload?.payload as { requestType: string }).requestType ?? ''),
											]}
										/>
									</PieChart>
								</ResponsiveContainer>
							</ChartCard>
						)}

						{isChartEnabled('sla') && (
							<ChartCard
								title={CHART_LABELS.sla}
								description="Estado del cumplimiento de SLA."
							>
								<ResponsiveContainer width="100%" height={320}>
									<BarChart data={bySlaData}>
										<CartesianGrid strokeDasharray="3 3" stroke="#cbd5f5" />
										<XAxis dataKey="sla" stroke="#94a3b8" tickFormatter={capitalize} />
										<YAxis allowDecimals={false} stroke="#94a3b8" />
										<Tooltip formatter={(value: number) => numberFormat.format(value)} />
										<Bar dataKey="count" fill="#f97316" name="Casos" />
									</BarChart>
								</ResponsiveContainer>
							</ChartCard>
						)}

						{isChartEnabled('sector') && (
							<ChartCard
								title={CHART_LABELS.sector}
								description="Volumen por sector asignado."
							>
								<ResponsiveContainer width="100%" height={320}>
									<BarChart data={bySectorData}>
										<CartesianGrid strokeDasharray="3 3" stroke="#cbd5f5" />
										<XAxis dataKey="label" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} />
										<YAxis allowDecimals={false} stroke="#94a3b8" />
										<Tooltip formatter={(value: number) => numberFormat.format(value)} />
										<Bar dataKey="count" fill="#0ea5e9" name="Casos" />
									</BarChart>
								</ResponsiveContainer>
							</ChartCard>
						)}

						{isChartEnabled('intake') && (
							<ChartCard
								title={CHART_LABELS.intake}
								description="Canales de origen de los casos."
							>
								<ResponsiveContainer width="100%" height={320}>
									<PieChart>
										<Pie
											data={byIntakeData}
											dataKey="count"
											nameKey="intakeChannel"
											cx="50%"
											cy="50%"
											outerRadius={110}
																							label={({ payload }) => {
																								const entry = payload as { intakeChannel: string; count: number }
																								return `${capitalize(entry.intakeChannel)} (${entry.count})`
																							}}
										>
											{byIntakeData.map((entry, index) => (
												<Cell key={entry.intakeChannel} fill={CHART_COLORS[index % CHART_COLORS.length]} />
											))}
										</Pie>
										<Tooltip
											formatter={(value: number, _name, payload) => [
												numberFormat.format(value),
												capitalize((payload?.payload as { intakeChannel: string }).intakeChannel ?? ''),
											]}
										/>
									</PieChart>
								</ResponsiveContainer>
							</ChartCard>
						)}
					</div>
				</div>
			) : null}
		</div>
	)
}

function KpiCard({
	title,
	value,
	subtitle,
}: {
	title: string
	value: number | string
	subtitle?: string | null
}) {
	return (
		<Card className="shadow-none ring-1 ring-slate-200/80">
			<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
			<p className="mt-2 text-2xl font-semibold text-slate-900">
				{typeof value === 'number' ? numberFormat.format(value) : value}
			</p>
			{subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
		</Card>
	)
}

function ChartCard({
	title,
	description,
	children,
}: {
	title: string
	description?: string
	children: React.ReactNode
}) {
	return (
		<Card className="h-full">
			<div className="mb-4 space-y-1">
				<h3 className="text-base font-semibold text-slate-800">{title}</h3>
				{description && <p className="text-sm text-slate-500">{description}</p>}
			</div>
			<div className="h-[260px] w-full">{children}</div>
		</Card>
	)
}

function createDefaultFilters(): MetricsFilterValue {
	const end = new Date()
	const start = new Date()
	start.setDate(start.getDate() - 89)
	return {
		startDate: formatDateInput(start),
		endDate: formatDateInput(end),
		sectorIds: [],
		requestTypes: [],
		statuses: [],
		slaStatuses: [],
		intakeChannels: [],
	}
}

function formatDateInput(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function formatDays(value: number | null | undefined): string {
	if (value == null) return 'Sin datos'
	const rounded = Math.round(value * 10) / 10
	return `${rounded} días`
}

function formatMedian(value: number | null | undefined): string | null {
	if (value == null) return null
	const rounded = Math.round(value * 10) / 10
	return `Mediana: ${rounded} días`
}

function capitalize(value: string): string {
	return value.replace(/\b\p{L}/gu, (match) => match.toUpperCase())
}

