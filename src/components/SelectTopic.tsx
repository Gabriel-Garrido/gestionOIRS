import { useMemo, useState } from 'react'
import { topics, type Topic } from '../types/oirs'

export default function SelectTopic({
  value,
  onChange,
  disabled,
  hideNoAplica,
  className = '',
}: {
  value?: Topic
  onChange: (v: Topic) => void
  disabled?: boolean
  hideNoAplica?: boolean
  className?: string
}) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    if (!q) return topics
    const qq = q.toLowerCase()
    return topics.filter((t) => t.toLowerCase().includes(qq))
  }, [q])
  const inputCls =
    'w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white'
  const disabledCls = 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-60'
  return (
    <div aria-disabled={disabled}>
      {/* Reservamos el espacio del buscador incluso cuando está deshabilitado para evitar saltos de layout */}
      <div className="mb-1">
        {disabled ? (
          <div className={`${inputCls} ${disabledCls}`} aria-hidden>
            {/* Placeholder visual del buscador deshabilitado */}
          </div>
        ) : (
          <input
            className={inputCls}
            placeholder="Buscar tema"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        )}
      </div>
      <select
        className={[inputCls, disabled ? disabledCls : '', className].filter(Boolean).join(' ')}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value as Topic)}
        disabled={disabled}
      >
        <option value="">Seleccione tema</option>
        {(disabled ? topics : filtered)
          .filter((t) => (hideNoAplica ? t !== 'No aplica' : true))
          .map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
      </select>
      <div className="mt-1 min-h-[1.25rem]">
        {/* reserva altura para helper */}
        {disabled && (
          <p className="text-xs text-gray-500 italic">
            Campo deshabilitado hasta seleccionar un tipo "reclamo".
          </p>
        )}
      </div>
    </div>
  )
}
