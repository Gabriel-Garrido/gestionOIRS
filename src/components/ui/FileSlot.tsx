import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
  WheelEvent as ReactWheelEvent,
} from 'react'
import Button from './Button'
import Icon from './Icon'
import Modal from './Modal'
import Toast from './Toast'
import { removeFile } from '../../services/firebase/storage'
import { addEvent, updateCase } from '../../services/oirsRepo'
import type { FileMeta, OirsCase } from '../../types/oirs'
import { useAuth } from '../../hooks/useAuth'

type FieldKey = 'caseOriginalFile' | 'staffReplyFile' | 'responseMainFile'
type BusyState = 'remove' | null
type ToastState = { message: string; type?: 'success' | 'error' | 'info' }

type Props = {
  caseId: string
  field: FieldKey
  file?: FileMeta | null
  onChanged?: () => void
  label?: string
  showRemoveOnly?: boolean
}

const fieldLabels: Record<FieldKey, string> = {
  caseOriginalFile: 'Caso original',
  staffReplyFile: 'Descargos',
  responseMainFile: 'Respuesta final',
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function distanceBetweenTouches(touches: any) {
  if (touches.length < 2) return 0
  const first = touches[0] ?? touches.item(0)
  const second = touches[1] ?? touches.item(1)
  if (!first || !second) return 0
  const dx = first.clientX - second.clientX
  const dy = first.clientY - second.clientY
  return Math.hypot(dx, dy)
}

export default function FileSlot({
  caseId,
  field,
  file,
  onChanged,
  label,
  showRemoveOnly = false,
}: Props) {
  const { user } = useAuth()
  const previewRef = useRef<HTMLDivElement>(null)
  const panPointRef = useRef<{ x: number; y: number } | null>(null)
  const pinchRef = useRef<number | null>(null)

  const [busy, setBusy] = useState<BusyState>(null)
  const [toast, setToast] = useState<ToastState | null>(null)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [imgZoom, setImgZoom] = useState(100)
  const [imgRotate, setImgRotate] = useState(0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [pdfZoom, setPdfZoom] = useState(100)
  const [pdfPage, setPdfPage] = useState(1)

  const hasFile = Boolean(file?.name)
  const canPreviewImage = Boolean(file?.mime?.startsWith('image/'))
  const canPreviewPdf = file?.mime === 'application/pdf'
  const canPreview = canPreviewImage || canPreviewPdf
  // Eliminar label de reemplazo/subida

  const toastNode = toast ? (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={() => {
        setToast(null)
      }}
    />
  ) : null

  const openPreview = useCallback(() => {
    if (!file?.url) return
    setPreviewOpen(true)
    setPreviewLoading(canPreview)
    setImgZoom(100)
    setImgRotate(0)
    setPan({ x: 0, y: 0 })
    setPdfZoom(100)
    setPdfPage(1)
  }, [file?.url, canPreview])

  useEffect(() => {
    if (!previewOpen) {
      setPreviewLoading(false)
      setIsPanning(false)
      panPointRef.current = null
      pinchRef.current = null
    }
  }, [previewOpen])

  useEffect(() => {
    setPdfPage(1)
    setPdfZoom(100)
    setImgZoom(100)
    setImgRotate(0)
    setPan({ x: 0, y: 0 })
  }, [file?.url])

  const previewTrigger = file?.url ? (
    <Button size="sm" variant="outline" onClick={openPreview} leftIcon={<Icon name="eye" />}>
      Vista previa
    </Button>
  ) : null

  const handleImageWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      if (!canPreviewImage) return
      event.preventDefault()
      const direction = event.deltaY > 0 ? -10 : 10
      setImgZoom((zoom) => clamp(zoom + direction, 25, 400))
    },
    [canPreviewImage]
  )

  const handlePointerDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!canPreviewImage) return
      event.preventDefault()
      setIsPanning(true)
      panPointRef.current = { x: event.clientX, y: event.clientY }
    },
    [canPreviewImage]
  )

  const handlePointerMove = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!canPreviewImage || !isPanning || !panPointRef.current) return
      event.preventDefault()
      const { clientX, clientY } = event
      const last = panPointRef.current
      const dx = clientX - last.x
      const dy = clientY - last.y
      panPointRef.current = { x: clientX, y: clientY }
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
    },
    [canPreviewImage, isPanning]
  )

  const releasePointer = useCallback(() => {
    setIsPanning(false)
    panPointRef.current = null
  }, [])

  const handleTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (!canPreviewImage) return
      if (event.touches.length === 1) {
        setIsPanning(true)
        panPointRef.current = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        }
      } else if (event.touches.length === 2) {
        pinchRef.current = distanceBetweenTouches(event.touches)
      }
    },
    [canPreviewImage]
  )

  const handleTouchMove = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (!canPreviewImage) return
      if (event.touches.length === 2) {
        event.preventDefault()
        const currentDistance = distanceBetweenTouches(event.touches)
        if (!pinchRef.current) {
          pinchRef.current = currentDistance
          return
        }
        const delta = currentDistance - pinchRef.current
        pinchRef.current = currentDistance
        setImgZoom((zoom) => clamp(zoom + delta * 0.1, 25, 400))
        return
      }
      if (!isPanning || event.touches.length !== 1 || !panPointRef.current) return
      event.preventDefault()
      const touch = event.touches[0]
      const dx = touch.clientX - panPointRef.current.x
      const dy = touch.clientY - panPointRef.current.y
      panPointRef.current = { x: touch.clientX, y: touch.clientY }
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
    },
    [canPreviewImage, isPanning]
  )

  const handleTouchEnd = useCallback(() => {
    if (!canPreviewImage) return
    setIsPanning(false)
    panPointRef.current = null
    pinchRef.current = null
  }, [canPreviewImage])

  const previewModal = file ? (
    <Modal
      open={previewOpen}
      onClose={() => setPreviewOpen(false)}
      title={file.name || 'Vista previa'}
      size="lg"
      fullOnMobile
      backdrop="blur"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {canPreviewImage ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setImgZoom((z) => clamp(z - 10, 25, 400))}
              >
                Zoom -
              </Button>
              <div className="w-16 text-center text-sm font-medium">{imgZoom}%</div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setImgZoom((z) => clamp(z + 10, 25, 400))}
              >
                Zoom +
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setImgZoom(100)
                  setPan({ x: 0, y: 0 })
                  setImgRotate(0)
                }}
              >
                Restablecer
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setImgRotate((deg) => (deg + 90) % 360)}
                leftIcon={<Icon name="rotate" />}
              >
                Rotar
              </Button>
            </>
          ) : canPreviewPdf ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPdfZoom((z) => clamp(z - 10, 50, 200))}
              >
                Zoom -
              </Button>
              <div className="w-16 text-center text-sm font-medium">{pdfZoom}%</div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPdfZoom((z) => clamp(z + 10, 50, 200))}
              >
                Zoom +
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPdfZoom(100)}>
                Restablecer
              </Button>
              <div className="mx-2 inline-flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                >
                  {'<'} Anterior
                </Button>
                <span className="text-sm">Página {pdfPage}</span>
                <Button size="sm" variant="outline" onClick={() => setPdfPage((p) => p + 1)}>
                  Siguiente {'>'}
                </Button>
              </div>
            </>
          ) : (
            <span className="text-sm text-gray-600">
              Este tipo de archivo no cuenta con vista previa integrada.
            </span>
          )}
          {file.url && (
            <>
              <Button
                as="a"
                href={file.url}
                target="_blank"
                rel="noreferrer"
                size="sm"
                variant="outline"
              >
                Abrir en pestaña
              </Button>
              <Button
                as="a"
                href={file.url}
                download
                size="sm"
                variant="outline"
                leftIcon={<Icon name="download" />}
              >
                Descargar
              </Button>
            </>
          )}
        </div>

        <div
          ref={previewRef}
          tabIndex={0}
          aria-label="Vista previa del archivo"
          className="relative h-[70vh] w-full overflow-hidden rounded-lg border bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
          onWheel={handleImageWheel}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={releasePointer}
          onMouseLeave={releasePointer}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {previewLoading && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/70">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          )}

          {canPreviewImage && file.url ? (
            <div className="relative h-full w-full overflow-auto">
              <img
                src={file.url}
                alt={file.name}
                onLoad={() => setPreviewLoading(false)}
                draggable={false}
                onDragStart={(event) => event.preventDefault()}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${imgZoom / 100}) rotate(${imgRotate}deg)`,
                  transformOrigin: 'center center',
                  willChange: 'transform',
                  userSelect: 'none',
                }}
                className={['select-none', isPanning ? 'cursor-grabbing' : 'cursor-grab'].join(' ')}
              />
            </div>
          ) : canPreviewPdf && file.url ? (
            <iframe
              key={`${pdfZoom}-${pdfPage}`}
              src={buildPdfUrl(file.url, pdfZoom, pdfPage)}
              title={file.name}
              className="h-full w-full"
              onLoad={() => setPreviewLoading(false)}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-sm text-gray-600">
              No hay vista previa disponible.
            </div>
          )}
        </div>
      </div>
    </Modal>
  ) : null

  const clearFile = useCallback(async () => {
    if (!file) return
    try {
      setBusy('remove')
      if (file.path) await removeFile(file.path)
      await updateCase(caseId, { [field]: null } as Partial<OirsCase>)
      await addEvent(caseId, {
        type: 'file_upload',
        by: user?.email ?? 'sistema',
        at: new Date().toISOString(),
        payload: {
          field,
          fieldLabel: fieldLabels[field],
          action: 'remove',
          name: file.name,
        },
      })
      setToast({ message: 'Archivo eliminado correctamente', type: 'success' })
      onChanged?.()
    } catch (error) {
      console.error(error)
      setToast({ message: 'No se pudo eliminar el archivo', type: 'error' })
    } finally {
      setBusy(null)
    }
  }, [caseId, field, file, onChanged, user?.email])

  // Funcionalidad de subir/reemplazar archivo eliminada

  // Vista de solo reemplazo eliminada

  if (showRemoveOnly) {
    if (!hasFile) return null
    return (
      <>
        <div className="flex flex-wrap items-center gap-2">
          {previewTrigger}
          <Button size="sm" variant="danger" onClick={clearFile} disabled={busy !== null}>
            {label ?? 'Quitar'}
          </Button>
        </div>
        {toastNode}
        {previewModal}
      </>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="min-w-0">
          <div className="text-xs text-gray-600">{label ?? 'Archivo'}</div>
          {hasFile ? (
            <div className="mt-0.5 truncate text-sm">
              <span className="inline-flex items-center gap-1">
                <Icon name="document" />
                <span title={file?.name}>{file?.name}</span>
              </span>
              {typeof file?.size === 'number' && (
                <span className="ml-2 text-xs text-gray-500">
                  {Math.max(1, Math.round(file.size / 1024))} KB
                </span>
              )}
            </div>
          ) : (
            <div className="mt-0.5 text-sm text-gray-500">Sin archivo</div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {hasFile && file?.url && (
            <Button
              as="a"
              href={file.url}
              download
              variant="outline"
              size="sm"
              leftIcon={<Icon name="download" />}
            >
              Descargar
            </Button>
          )}
          {previewTrigger}
          {hasFile && (
            <Button size="sm" variant="danger" onClick={clearFile} disabled={busy !== null}>
              Quitar
            </Button>
          )}
        </div>
      </div>
      {toastNode}
      {previewModal}
    </>
  )
}

function buildPdfUrl(url: string, zoom: number, page = 1) {
  const base = url.split('#')[0]
  return `${base}#page=${page}&zoom=${zoom}`
}
