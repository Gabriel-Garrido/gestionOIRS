import { useEffect, useRef } from 'react'

export default function Drawer({
  open,
  onClose,
  title,
  children,
  width = 'md',
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  width?: 'sm' | 'md' | 'lg'
}) {
  const titleId = useRef(`drawer-title-${Math.random().toString(36).slice(2)}`)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  const w = width === 'sm' ? 'w-64' : width === 'lg' ? 'w-[28rem]' : 'w-80'
  return (
    <div
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId.current : undefined}
      className={[open ? 'fixed inset-0 z-50' : 'hidden'].join(' ')}
    >
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className={['ml-auto h-full bg-white shadow-elevation2', w].join(' ')}>
        {title && (
          <div id={titleId.current} className="border-b px-4 py-3 font-medium">
            {title}
          </div>
        )}
        <div className="p-4 overflow-auto h-full">{children}</div>
      </aside>
    </div>
  )
}
