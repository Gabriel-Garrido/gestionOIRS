import { useEffect, useMemo, useState } from 'react'
import { listSectors } from '../services/oirsRepo'

type Option = { id: string; name: string }

export default function SelectSector({
  value,
  onChange,
  placeholder = 'Sector',
  disabled,
}: {
  value?: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  const [options, setOptions] = useState<Option[]>([])
  const [q, setQ] = useState('')

  useEffect(() => {
    listSectors().then((s) =>
      setOptions((s ?? []).map((x) => ({ id: (x.id as string) || '', name: x.name })))
    )
  }, [])
  const filtered = useMemo(() => {
    if (!q) return options
    const qq = q.toLowerCase()
    return options.filter(
      (o) => o.name.toLowerCase().includes(qq) || o.id.toLowerCase().includes(qq)
    )
  }, [q, options])

  return (
    <div>
      <input
        type="text"
        className="mb-1 w-full rounded border px-2 py-1 text-sm"
        placeholder={`Buscar ${placeholder.toLowerCase()}`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        disabled={disabled}
      />
      <select
        className="w-full rounded border px-2 py-1"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {filtered.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  )
}
