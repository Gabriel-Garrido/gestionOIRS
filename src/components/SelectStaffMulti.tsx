import { useEffect, useMemo, useRef, useState } from 'react'
import { listStaff } from '../services/oirsRepo'
import Input from './ui/Input'
import Icon from './ui/Icon'

type Option = { id: string; name: string; email?: string }

export default function SelectStaffMulti({
  value,
  onChange,
  placeholder = 'Funcionario(s) aludido(s)',
  // size ya no se usa visualmente, se mantiene para compatibilidad
  size: _size = 6,
  disabled,
}: {
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  size?: number
  disabled?: boolean
}) {
  const [options, setOptions] = useState<Option[]>([])
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    listStaff().then((s) =>
      setOptions(
        (s ?? []).map((x) => ({
          id: x.id!,
          name: x.name || x.email || (x.id as string),
          email: x.email,
        }))
      )
    )
  }, [])

  const selectedSet = useMemo(() => new Set(value), [value])
  const filtered = useMemo(() => {
    const base = options.filter((o) => !selectedSet.has(o.id))
    if (!q) return base
    const qq = q.toLowerCase()
    return base.filter(
      (o) => o.name?.toLowerCase().includes(qq) || o.email?.toLowerCase().includes(qq)
    )
  }, [q, options, selectedSet])

  function add(id: string) {
    if (disabled) return
    if (!value.includes(id)) onChange([...value, id])
    setQ('')
    setOpen(false)
    setHighlight(0)
    // Salir del foco inmediatamente para evitar que el usuario tenga que clicar afuera
    inputRef.current?.blur()
  }
  function remove(id: string) {
    if (disabled) return
    onChange(value.filter((v) => v !== id))
    inputRef.current?.focus()
  }

  // Cerrar al clicar fuera
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const selectedOptions = useMemo(
    () => options.filter((o) => selectedSet.has(o.id)),
    [options, selectedSet]
  )

  return (
    <div className="grid gap-2 sm:grid-cols-2" ref={wrapRef}>
      <div className="relative">
        <Input
          ref={inputRef as any}
          placeholder={`Buscar ${placeholder.toLowerCase()}`}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
            setHighlight(0)
          }}
          onFocus={() => {
            if (!disabled) {
              setOpen(true)
              setHighlight(0) // Mostrar listado al hacer foco
            }
          }}
          onKeyDown={(e) => {
            if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
              setOpen(true)
              return
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setHighlight((h) => Math.max(h - 1, 0))
            } else if (e.key === 'Enter') {
              if (filtered[highlight]) add(filtered[highlight].id)
            } else if (e.key === 'Escape') {
              setOpen(false)
            } else if (e.key === 'Backspace' && q === '' && value.length > 0) {
              // quitar el último seleccionado
              remove(value[value.length - 1])
            }
          }}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
          role="combobox"
          aria-autocomplete="list"
        />

        {open && filtered.length > 0 && (
          <ul
            role="listbox"
            className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded border bg-white shadow-elevation2"
          >
            {filtered.slice(0, 50).map((o, i) => (
              <li
                key={o.id}
                role="option"
                aria-selected={highlight === i}
                className={[
                  'cursor-pointer px-3 py-2 text-sm hover:bg-gray-50',
                  highlight === i ? 'bg-gray-50' : '',
                ].join(' ')}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault() // evita blur del input antes del click
                  add(o.id)
                }}
              >
                <div className="font-medium">{o.name}</div>
                {o.email && <div className="text-xs text-gray-600">{o.email}</div>}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-1 text-xs text-gray-600">
          Puede quedar vacío si no hay funcionario aludido.
        </p>
      </div>

      <div className="min-w-0">
        <div className="text-xs text-gray-600 mb-1">Seleccionados</div>
        {selectedOptions.length === 0 ? (
          <div className="text-sm text-gray-500">Sin aludidos</div>
        ) : (
          <div className="flex flex-col gap-2 overflow-x-hidden">
            {selectedOptions.map((o) => (
              <span
                key={o.id}
                className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-sm bg-white"
              >
                <span>{o.name}</span>
                {o.email && <span className="text-gray-500">— {o.email}</span>}
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => remove(o.id)}
                  aria-label={`Quitar ${o.name}`}
                >
                  <Icon name="x-circle" className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
