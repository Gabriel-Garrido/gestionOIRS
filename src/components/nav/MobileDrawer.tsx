import { useEffect, useRef } from 'react'
import Icon from '../../components/ui/Icon'

type MobileDrawerProps = {
  id?: string
  open: boolean
  title?: string
  onClose: () => void
  children: React.ReactNode
}

// Drawer lateral móvil accesible con overlay, animación y focus management básico
export default function MobileDrawer({
  id = 'mobile-drawer',
  open,
  title = 'Menú',
  onClose,
  children,
}: MobileDrawerProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Enfocar el botón cerrar al abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => closeBtnRef.current?.focus(), 0)
    }
  }, [open])

  // Cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Mantener el foco dentro del panel con Tab simple (ciclo)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return
      if (e.key !== 'Tab') return
      const container = panelRef.current
      if (!container) return
      const focusables = container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault()
          ;(last as HTMLElement).focus()
        }
      } else {
        if (active === last) {
          e.preventDefault()
          ;(first as HTMLElement).focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div aria-hidden={!open}>
      {/* Overlay */}
      <div
        className={[
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity md:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        id={id}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={[
          'fixed inset-y-0 left-0 z-50 w-[88vw] max-w-[22rem] overflow-hidden border-r border-black/10 bg-white shadow-2xl ring-1 ring-black/10 transition-transform duration-200 md:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between gap-2 border-b border-black/10 px-3 py-2.5">
          <div className="text-sm font-semibold text-gray-800">{title}</div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center gap-2 rounded-xl px-2 text-gray-700 hover:bg-gray-100 focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <Icon name="x-circle" />
            <span className="text-sm">Cerrar</span>
          </button>
        </div>
        <div className="flex max-h-[calc(100dvh-48px)] flex-col overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
