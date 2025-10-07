import type { SlaStatus } from '../../types/oirs'

export default function SlaChip({ value }: { value: SlaStatus }) {
  const cls =
    value === 'dentro de plazo'
      ? 'bg-green-100 text-green-800'
      : value === 'fuera de plazo'
        ? 'bg-red-100 text-red-800'
        : value === 'pendiente dentro de plazo'
          ? 'bg-yellow-100 text-yellow-800'
          : 'bg-gray-100 text-gray-800'
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
      {value}
    </span>
  )
}
