import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'full'
  showClose?: boolean
  fullOnMobile?: boolean
  backdrop?: 'dim' | 'blur' | 'none'
  closeOnOverlayClick?: boolean
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showClose = true,
  fullOnMobile = false,
  backdrop = 'dim',
  closeOnOverlayClick = true,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2)}`)
  const descId = useRef(`modal-desc-${Math.random().toString(36).slice(2)}`)
  const [mounted, setMounted] = useState(open)
  const [show, setShow] = useState(open)

  // Manejo de montaje y animación
  useEffect(() => {
    if (open) {
      setMounted(true)
      requestAnimationFrame(() => setShow(true))
    } else {
      setShow(false)
    }
  }, [open])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (mounted) {
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
      // Enfocar al abrir
      setTimeout(() => {
        const root = panelRef.current
        if (!root) return
        const active = document.activeElement
        if (active && root.contains(active)) return
        // Selector corregido para evitar errores de DOMException
        const focusables = root.querySelectorAll<HTMLElement>(
          'textarea,input,select,button,a[href],[tabindex]:not([tabindex="-1"])'
        )
        if (focusables.length > 0) focusables[0].focus()
        else root.focus()
      }, 0)
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [mounted, onClose])

  // Focus trap básico
  useEffect(() => {
    function trap(e: KeyboardEvent) {
      if (!mounted || e.key !== 'Tab') return
      const root = panelRef.current
      if (!root) return
      const focusables = root.querySelectorAll<HTMLElement>(
        'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    if (mounted) document.addEventListener('keydown', trap)
    return () => document.removeEventListener('keydown', trap)
  }, [mounted])

  const backdropClass = useMemo(() => {
    if (backdrop === 'none') return ''
    if (backdrop === 'blur') return 'backdrop-blur-sm bg-black/30'
    return 'bg-black/40'
  }, [backdrop])

  if (!mounted) return null

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:px-6 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId.current : undefined}
      aria-describedby={descId.current}
    >
      <div
        className={[
          'absolute inset-0 transition-opacity duration-200 motion-reduce:transition-none',
          backdropClass,
          show ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        onClick={() => {
          if (closeOnOverlayClick) onClose()
        }}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onTransitionEnd={() => {
          if (!show) setMounted(false)
        }}
        className={[
          'relative z-10 bg-white shadow-xl outline-hidden overscroll-contain',
          // Transiciones de entrada/salida
          'transition-transform duration-200 motion-reduce:transition-none',
          show ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
          // Layout: full viewport, con margen horizontal en desktop
          'h-[100dvh] w-[100vw] sm:h-full sm:w-full',
          // Si se permite pantalla completa en móvil, sin esquinas; en desktop damos un radio moderno
          fullOnMobile ? 'rounded-none sm:rounded-xl' : 'rounded-xl',
          // Ajustar densidad por tamaño en desktop (afecta paddings internos del header/footer vía util classes)
          size === 'sm'
            ? 'sm:max-w-2xl'
            : size === 'lg'
              ? 'sm:max-w-6xl'
              : size === 'full'
                ? 'sm:max-w-[100vw]'
                : 'sm:max-w-4xl',
        ].join(' ')}
      >
        <div className="flex h-full min-h-0 w-full flex-col">
          {title && (
            <div className="sticky top-0 z-[1] border-b bg-white/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/80">
              <h3 id={titleId.current} className="pr-8 text-base font-semibold">
                {title}
              </h3>
              {showClose && (
                <button
                  type="button"
                  aria-label="Cerrar"
                  title="Cerrar"
                  onClick={onClose}
                  className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 focus:outline-hidden focus:ring-3 focus:ring-blue-500/40"
                >
                  <Icon name="x-circle" />
                </button>
              )}
            </div>
          )}
          <div id={descId.current} className="flex-1 overflow-auto p-4">
            {children}
          </div>
          {footer && (
            <div className="sticky bottom-0 z-[1] border-t bg-gray-50/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-gray-50/80">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
