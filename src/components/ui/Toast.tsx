import { useEffect, useState } from 'react'

type ToastProps = {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose?: () => void
}

export default function Toast({ message, type = 'info', duration = 3500, onClose }: ToastProps) {
  const [open, setOpen] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => {
      setOpen(false)
      onClose?.()
    }, duration)
    return () => clearTimeout(t)
  }, [duration, onClose])
  if (!open) return null
  const colors: Record<typeof type, string> = {
    info: 'bg-blue-600',
    success: 'bg-green-600',
    error: 'bg-red-600',
  }
  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div
        className={[
          'rounded-md px-4 py-2 text-sm text-white shadow-lg ring-1 ring-black/10',
          colors[type],
        ].join(' ')}
      >
        {message}
      </div>
    </div>
  )
}
