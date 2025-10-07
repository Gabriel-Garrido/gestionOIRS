import { useState, useEffect } from 'react'
import { requestTypes, caseStatuses, slaStatuses, type SlaStatus } from '../../types/oirs'

export type CasesFiltersValue = {
  sectorId?: string
  requestType?: string
  status?: string
  sla?: SlaStatus
  folio?: string
  year?: string // YYYY
  month?: string // MM
  staffId?: string
}

const FilterInput = ({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string
  value: string
  onChange: (value: string) => void
}) => (
  <input
    placeholder={placeholder}
    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
)

const FilterSelect = ({
  placeholder,
  value,
  options,
  onChange,
}: {
  placeholder: string
  value: string
  options: { label: string; value: string }[]
  onChange: (value: string) => void
}) => (
  <select
    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
    value={value}
    onChange={(e) => onChange(e.target.value)}
  >
    <option value="">{placeholder}</option>
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
)

const defaultYear = String(new Date().getFullYear())
const defaultMonth = String(new Date().getMonth() + 1).padStart(2, '0')

export default function CasesFilters({
  value,
  onChange,
  sectors,
  staff,
}: {
  value: CasesFiltersValue
  onChange: (next: Partial<CasesFiltersValue>) => void
  sectors: { id: string; name: string }[]
  staff: { id: string; name: string; email?: string }[]
}) {
  // Modo año completo: usamos el centinela 'ALL' en month
  const [showAllYear, setShowAllYear] = useState(value.month === 'ALL')

  useEffect(() => {
    if (showAllYear) {
      const y = value.year ?? defaultYear
      if (value.month !== 'ALL') onChange({ year: y, month: 'ALL' })
    } else {
      if (value.month === 'ALL') onChange({ month: defaultMonth })
      if (!value.year) onChange({ year: defaultYear })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAllYear])

  const handleChange = (key: keyof CasesFiltersValue) => (val: string) => {
    onChange({ [key]: val })
  }

  const toggleShowAllYear = () => setShowAllYear((p) => !p)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          id="showAllYear"
          type="checkbox"
          checked={showAllYear}
          onChange={toggleShowAllYear}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="showAllYear" className="text-sm text-gray-700">
          Ver todos los del año
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
        <FilterInput
          placeholder="Folio"
          value={value.folio ?? ''}
          onChange={handleChange('folio')}
        />
        <FilterSelect
          placeholder="Sector"
          value={value.sectorId ?? ''}
          options={sectors.map((s) => ({ label: s.name, value: s.id }))}
          onChange={handleChange('sectorId')}
        />
        <FilterSelect
          placeholder="Tipo"
          value={value.requestType ?? ''}
          options={requestTypes.map((t) => ({ label: t, value: t }))}
          onChange={handleChange('requestType')}
        />
        <FilterSelect
          placeholder="Estado"
          value={value.status ?? ''}
          options={caseStatuses.map((t) => ({ label: t, value: t }))}
          onChange={handleChange('status')}
        />
        <FilterSelect
          placeholder="SLA"
          value={value.sla ?? ''}
          options={slaStatuses.map((t) => ({ label: t, value: t }))}
          onChange={(val) => onChange({ sla: val as SlaStatus })}
        />
        <FilterSelect
          placeholder="Funcionario"
          value={value.staffId ?? ''}
          options={staff.map((s) => ({
            label: `${s.name}${s.email ? ` — ${s.email}` : ''}`,
            value: s.id,
          }))}
          onChange={handleChange('staffId')}
        />
      </div>
    </div>
  )
}
