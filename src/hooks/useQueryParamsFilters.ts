import { useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

type Options = { storageKey?: string }

export function useQueryParamsFilters<T extends Record<string, unknown>>(
  defaults: T,
  opts: Options = {}
) {
  const [params, setParams] = useSearchParams()
  const inited = useRef(false)
  const filters = useMemo(() => {
    const obj: Record<string, unknown> = { ...defaults }
    for (const [k, v] of params.entries()) obj[k] = v
    return obj as T
  }, [params, defaults])

  function update(next: Partial<T>) {
    const merged = { ...filters, ...next }
    const sp = new URLSearchParams()
    Object.entries(merged).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).length) sp.set(k, String(v))
    })
    setParams(sp, { replace: true })
    if (opts.storageKey) {
      try {
        localStorage.setItem(opts.storageKey, JSON.stringify(Object.fromEntries(sp.entries())))
      } catch {}
    }
  }
  function reset() {
    const sp = new URLSearchParams()
    Object.entries(defaults).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).length) sp.set(k, String(v))
    })
    setParams(sp, { replace: true })
    if (opts.storageKey) {
      try {
        localStorage.setItem(opts.storageKey, JSON.stringify(Object.fromEntries(sp.entries())))
      } catch {}
    }
  }

  // inicializar desde localStorage si no hay params
  useEffect(() => {
    if (inited.current) return
    inited.current = true
    if (!opts.storageKey) return
    const hasParams = Array.from(params.keys()).length > 0
    if (hasParams) return
    try {
      const raw = localStorage.getItem(opts.storageKey)
      if (!raw) return
      const saved = JSON.parse(raw) as Record<string, string>
      const sp = new URLSearchParams()
      Object.entries(saved).forEach(([k, v]) => sp.set(k, v))
      setParams(sp, { replace: true })
    } catch {}
  }, [opts.storageKey, params, setParams])

  return { filters, update, reset }
}
