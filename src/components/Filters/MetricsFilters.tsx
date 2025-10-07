import type {
	CaseStatus,
	IntakeChannel,
	RequestType,
	SlaStatus,
} from '../../types/oirs'
import { caseStatuses, intakeChannels, requestTypes, slaStatuses } from '../../types/oirs'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Label from '../ui/Label'

export type MetricsFilterValue = {
	startDate: string
	endDate: string
	sectorIds: string[]
	requestTypes: RequestType[]
	statuses: CaseStatus[]
	slaStatuses: SlaStatus[]
	intakeChannels: IntakeChannel[]
}

export type MetricsFiltersProps = {
	value: MetricsFilterValue
	onChange: (next: MetricsFilterValue) => void
	onReset: () => void
	sectors: { id: string; name: string }[]
}

const RANGE_PRESETS: { label: string; days: number }[] = [
	{ label: '30 días', days: 30 },
	{ label: '90 días', days: 90 },
	{ label: '180 días', days: 180 },
	{ label: '12 meses', days: 365 },
]

export default function MetricsFilters({ value, onChange, onReset, sectors }: MetricsFiltersProps) {
	function update(partial: Partial<MetricsFilterValue>) {
		onChange({ ...value, ...partial })
	}

	function handlePreset(days: number) {
		const end = new Date()
		const start = new Date()
		start.setDate(start.getDate() - (days - 1))
		update({ startDate: formatDateInput(start), endDate: formatDateInput(end) })
	}

	function toggleArrayValue<T extends keyof MetricsFilterValue>(field: T, option: string) {
		const next = new Set(value[field] as string[])
		if (next.has(option)) {
			next.delete(option)
		} else {
			next.add(option)
		}
		update({ [field]: Array.from(next) } as Partial<MetricsFilterValue>)
	}

	return (
		<div className="space-y-6">
			<section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
				<div className="flex flex-wrap items-end gap-4">
					<div>
						<Label htmlFor="metrics-start">Desde</Label>
						<Input
							id="metrics-start"
							type="date"
							value={value.startDate}
							max={value.endDate}
							onChange={(event) => update({ startDate: event.target.value })}
						/>
					</div>
					<div>
						<Label htmlFor="metrics-end">Hasta</Label>
						<Input
							id="metrics-end"
							type="date"
							value={value.endDate}
							min={value.startDate}
							max={formatDateInput(new Date())}
							onChange={(event) => update({ endDate: event.target.value })}
						/>
					</div>
					<div className="flex flex-wrap gap-2">
									{RANGE_PRESETS.map((preset) => (
										<Button
											key={preset.label}
											type="button"
											size="sm"
											variant="outline"
											onClick={() => handlePreset(preset.days)}
										>
								{preset.label}
							</Button>
						))}
					</div>
					<div className="ml-auto">
						<Button type="button" variant="ghost" onClick={onReset}>
							Limpiar filtros
						</Button>
					</div>
				</div>
			</section>

			<section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
				<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
					<FilterGroup
						title="Sectores"
						options={sectors.map((sector) => ({ id: sector.id, label: sector.name }))}
						selected={value.sectorIds}
						onToggle={(option) => toggleArrayValue('sectorIds', option)}
					/>
					<FilterGroup
						title="Tipo de solicitud"
						options={requestTypes.map((type) => ({ id: type, label: capitalize(type) }))}
						selected={value.requestTypes}
						onToggle={(option) => toggleArrayValue('requestTypes', option)}
					/>
					<FilterGroup
						title="Estado"
						options={caseStatuses.map((status) => ({ id: status, label: capitalize(status) }))}
						selected={value.statuses}
						onToggle={(option) => toggleArrayValue('statuses', option)}
					/>
					<FilterGroup
						title="Estado SLA"
						options={slaStatuses.map((sla) => ({ id: sla, label: capitalize(sla) }))}
						selected={value.slaStatuses}
						onToggle={(option) => toggleArrayValue('slaStatuses', option)}
					/>
					<FilterGroup
						title="Canal de ingreso"
						options={intakeChannels.map((channel) => ({ id: channel, label: capitalize(channel) }))}
						selected={value.intakeChannels}
						onToggle={(option) => toggleArrayValue('intakeChannels', option)}
					/>
				</div>
			</section>
		</div>
	)
}

function FilterGroup({
	title,
	options,
	selected,
	onToggle,
}: {
	title: string
	options: { id: string; label: string }[]
	selected: string[]
	onToggle: (id: string) => void
}) {
	return (
		<fieldset className="rounded-xl border border-slate-200 p-4">
			<legend className="px-1 text-sm font-semibold text-slate-700">{title}</legend>
			<div className="mt-3 grid gap-2 sm:grid-cols-2">
				{options.map((option) => {
					const inputId = `${title}-${option.id}`
					const checked = selected.includes(option.id)
					return (
						<label
							key={option.id}
							htmlFor={inputId}
							className="inline-flex items-center gap-2 rounded-lg border border-transparent px-2 py-1 text-sm transition hover:border-slate-300 hover:bg-slate-50"
						>
							<input
								id={inputId}
								type="checkbox"
								className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
								checked={checked}
								onChange={() => onToggle(option.id)}
							/>
							<span className="text-slate-700">{option.label}</span>
						</label>
					)
				})}
			</div>
		</fieldset>
	)
}

function formatDateInput(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function capitalize(value: string): string {
	return value.replace(/\b\p{L}/gu, (match) => match.toUpperCase())
}


