import { useEffect, useState } from 'react'
import Button from './ui/Button'
import Icon from './ui/Icon'
import Modal from './ui/Modal'
import Textarea from './ui/Textarea'
import Select from './ui/Select'
import Toast from './ui/Toast'
import { addEvent, getCase, updateCase } from '../services/oirsRepo'
import type { OirsCase } from '../types/oirs'
import { useAuth } from '../hooks/useAuth'
import { fmt } from '../utils/date'

export default function QuickActions({ id, onChanged }: { id: string; onChanged?: () => void }) {
  const { user } = useAuth()
  const [descargoOpen, setDescargoOpen] = useState(false)
  const [descargoText, setDescargoText] = useState('')
  const [respuestaOpen, setRespuestaOpen] = useState(false)
  const [tipoRespuesta, setTipoRespuesta] = useState<
    '' | 'correo' | 'carta' | 'plataforma' | 'otro'
  >('')
  const [toast, setToast] = useState<null | { msg: string; type: 'success' | 'error' | 'info' }>(
    null
  )
  const [currentStatus, setCurrentStatus] = useState<OirsCase['status'] | null>(null)
  const [loadingAction, setLoadingAction] = useState<
    null | 'to_staff' | 'descargo' | 'to_dir' | 'dir_reply' | 'responded' | 'archive'
  >(null)
  const [showDirReplyModal, setShowDirReplyModal] = useState(false)
  const [caseData, setCaseData] = useState<OirsCase | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const c = await getCase(id)
        if (active) {
          setCurrentStatus(c?.status ?? null)
          setCaseData(c)
        }
      } catch {}
    })()
    return () => {
      active = false
    }
  }, [id])

  const after = async () => {
    try {
      await onChanged?.()
      const c = await getCase(id)
      setCurrentStatus(c?.status ?? null)
      setCaseData(c)
    } catch {}
  }

  const statusOrder: OirsCase['status'][] = [
    'en revision',
    'enviado a funcionario',
    'descargos recibidos',
    'enviado a direccion',
    'respuesta direccion recibida',
    'respuesta enviada',
    'archivado',
  ]
  const currentIndex = currentStatus ? statusOrder.indexOf(currentStatus) : 0

  type StepKey = 'to_staff' | 'descargo' | 'to_dir' | 'dir_reply' | 'responded' | 'archive'
  interface StepDef {
    key: StepKey
    targetStatus: OirsCase['status']
    label: string
    description?: string
    icon: Parameters<typeof Icon>[0]['name']
    timestamp?: string | null | undefined
    actionType: 'direct' | 'modal' | 'dir-reply-modal'
  }

  const steps: StepDef[] = [
    {
      key: 'to_staff',
      targetStatus: 'enviado a funcionario',
      label: 'Enviado a funcionario',
      description: 'Caso enviado por correo a funcionario aludido y su jefatura.',
      icon: 'send',
      timestamp: caseData?.sentToStaffAt,
      actionType: 'direct',
    },
    {
      key: 'descargo',
      targetStatus: 'descargos recibidos',
      label: 'Descargos recibidos',
      description: 'Sube los descargos del funcionario.',
      icon: 'inbox-arrow-down',
      timestamp: caseData?.staffReplyAt,
      actionType: 'modal',
    },
    {
      key: 'to_dir',
      targetStatus: 'enviado a direccion',
      label: 'Enviado a Dirección',
      description: 'Propuesta de respuesta enviada a Dirección.',
      icon: 'send',
      timestamp: caseData?.sentToDireccionAt,
      actionType: 'direct',
    },
    {
      key: 'dir_reply',
      targetStatus: 'respuesta direccion recibida',
      label: 'Respuesta de Dirección recibida',
      description:
        'Respuesta final firmada por Dirección recibida, súbela en la sección correspondiente.',
      icon: 'chat-bubble',
      timestamp: caseData?.direccionReplyAt,
      actionType: 'dir-reply-modal',
    },
    {
      key: 'responded',
      targetStatus: 'respuesta enviada',
      label: 'Respuesta enviada al usuario',
      description: 'Respuesta enviada al usuario. Indica el tipo de respuesta enviada.',
      icon: 'check-circle',
      timestamp: caseData?.respondedAt,
      actionType: 'modal',
    },
    {
      key: 'archive',
      targetStatus: 'archivado',
      label: 'Archivar caso',
      description: 'Finaliza el ciclo y archiva el caso.',
      icon: 'archive-box',
      timestamp: caseData?.status === 'archivado' ? caseData?.updatedAt : undefined,
      actionType: 'direct',
    },
  ]

  const performDirect = async (step: StepDef) => {
    switch (step.key) {
      case 'to_staff': {
        setLoadingAction('to_staff')
        try {
          const current = await getCase(id)
          await updateCase(id, {
            status: 'enviado a funcionario',
            sentToStaffAt: new Date().toISOString(),
          })
          await addEvent(id, {
            type: 'status_change',
            by: user?.uid ?? 'anon',
            at: new Date().toISOString(),
            payload: { from: current?.status, to: 'enviado a funcionario' },
          })
          await addEvent(id, {
            type: 'send_to_staff',
            by: user?.uid ?? 'anon',
            at: new Date().toISOString(),
          })
          setToast({ msg: 'Estado: Enviado a funcionario', type: 'success' })
          await after()
        } finally {
          setLoadingAction(null)
        }
        break
      }
      case 'to_dir': {
        setLoadingAction('to_dir')
        try {
          const current = await getCase(id)
          await updateCase(id, {
            status: 'enviado a direccion',
            sentToDireccionAt: new Date().toISOString(),
          })
          await addEvent(id, {
            type: 'status_change',
            by: user?.uid ?? 'anon',
            at: new Date().toISOString(),
            payload: { from: current?.status, to: 'enviado a direccion' },
          })
          setToast({ msg: 'Estado: Enviado a dirección', type: 'success' })
          await after()
        } finally {
          setLoadingAction(null)
        }
        break
      }
      case 'archive': {
        setLoadingAction('archive')
        try {
          const current = await getCase(id)
          await updateCase(id, { status: 'archivado' })
          await addEvent(id, {
            type: 'status_change',
            by: user?.uid ?? 'anon',
            at: new Date().toISOString(),
            payload: { from: current?.status, to: 'archivado' },
          })
          setToast({ msg: 'Caso archivado', type: 'success' })
          await after()
        } finally {
          setLoadingAction(null)
        }
        break
      }
      default:
        break
    }
  }

  const canExecute = (idx: number) => {
    // puede ejecutar si todos los pasos previos están completados y este aún no
    const targetStatus = steps[idx].targetStatus
    const targetIndex = statusOrder.indexOf(targetStatus)
    return currentIndex < targetIndex && currentIndex + 1 === targetIndex
  }

  return (
    <>
      {/* Línea de tiempo vertical */}
      <div className="relative pl-6">
        <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-200" aria-hidden="true" />
        <ol className="space-y-6">
          {steps.map((step, i) => {
            const stepStatusIndex = statusOrder.indexOf(step.targetStatus)
            const reached = currentIndex >= stepStatusIndex
            const active = !reached && canExecute(i)
            const ts = step.timestamp ? fmt(step.timestamp) : null
            return (
              <li key={step.key} className="relative">
                <span
                  className={[
                    'absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors',
                    reached
                      ? 'bg-green-500 border-green-500 text-white'
                      : active
                        ? 'bg-white border-blue-500 text-blue-500 animate-pulse'
                        : 'bg-gray-100 border-gray-300 text-gray-400',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  {reached ? '✓' : i + 1}
                </span>
                <div className="rounded-md border border-gray-200 bg-white/70 p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Icon name={step.icon} />
                        <h4 className="text-sm font-semibold text-gray-800">{step.label}</h4>
                        {reached && (
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-green-600/20">
                            Completado
                          </span>
                        )}
                        {active && !reached && (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-blue-600/20">
                            Próximo
                          </span>
                        )}
                      </div>
                      {step.description && (
                        <p className="mt-1 text-xs text-gray-600 max-w-sm leading-relaxed">
                          {step.description}
                        </p>
                      )}
                      {ts && <p className="mt-1 text-xs text-gray-500">{ts}</p>}
                    </div>
                    <div className="mt-2 sm:mt-0 flex items-center gap-2">
                      {!reached &&
                        canExecute(i) &&
                        (step.actionType === 'direct' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!!loadingAction}
                            onClick={() => performDirect(step)}
                          >
                            {loadingAction === step.key ? 'Procesando…' : 'Marcar'}
                          </Button>
                        ) : step.actionType === 'modal' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!!loadingAction}
                            onClick={() => {
                              if (step.key === 'descargo') setDescargoOpen(true)
                              if (step.key === 'responded') setRespuestaOpen(true)
                            }}
                          >
                            {step.key === 'responded' ? 'Registrar envío' : 'Registrar'}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!!loadingAction}
                            onClick={() => setShowDirReplyModal(true)}
                          >
                            Registrar
                          </Button>
                        ))}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Modal descargos */}
      <Modal
        open={descargoOpen}
        onClose={() => setDescargoOpen(false)}
        title="Registrar descargos del funcionario"
        size="md"
        backdrop="blur"
        closeOnOverlayClick={false}
        fullOnMobile
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDescargoOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                try {
                  setLoadingAction('descargo')
                  const current = await getCase(id)
                  await updateCase(id, {
                    status: 'descargos recibidos',
                    staffReplyAt: new Date().toISOString(),
                    staffReplyText: descargoText || undefined,
                  })
                  await addEvent(id, {
                    type: 'status_change',
                    by: user?.uid ?? 'anon',
                    at: new Date().toISOString(),
                    payload: { from: current?.status, to: 'descargos recibidos' },
                  })
                  setToast({ msg: 'Estado: Descargo recibido', type: 'success' })
                  setDescargoOpen(false)
                  setDescargoText('')
                  await after()
                } finally {
                  setLoadingAction(null)
                }
              }}
            >
              Guardar
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Puedes añadir un resumen del descargo recibido.</p>
          <Textarea
            autoFocus
            rows={4}
            value={descargoText}
            onChange={(e) => setDescargoText(e.target.value)}
          />
        </div>
      </Modal>

      {/* Modal responder */}
      <Modal
        open={respuestaOpen}
        onClose={() => setRespuestaOpen(false)}
        title="Enviar respuesta al usuario"
        size="md"
        backdrop="blur"
        closeOnOverlayClick={false}
        fullOnMobile
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRespuestaOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!tipoRespuesta}
              onClick={async () => {
                const current = await getCase(id)
                const type: OirsCase['response']['type'] = tipoRespuesta ? tipoRespuesta : undefined
                try {
                  setLoadingAction('responded')
                  await updateCase(id, {
                    status: 'respuesta enviada',
                    respondedAt: new Date().toISOString(),
                    response: { ...(current?.response ?? {}), type },
                  })
                  await addEvent(id, {
                    type: 'status_change',
                    by: user?.uid ?? 'anon',
                    at: new Date().toISOString(),
                    payload: { from: current?.status, to: 'respuesta enviada', responseType: type },
                  })
                  setToast({ msg: 'Estado: Respuesta enviada al usuario', type: 'success' })
                  setRespuestaOpen(false)
                  setTipoRespuesta('')
                  await after()
                } finally {
                  setLoadingAction(null)
                }
              }}
            >
              Enviar respuesta
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Selecciona el tipo de respuesta para registrar el envío.
          </p>
          <Select
            value={tipoRespuesta}
            onChange={(e) => setTipoRespuesta(e.target.value as typeof tipoRespuesta)}
          >
            <option value="">Selecciona…</option>
            <option value="correo">correo</option>
            <option value="carta">carta</option>
            <option value="plataforma">plataforma</option>
            <option value="otro">otro</option>
          </Select>
        </div>
      </Modal>

      {/* Modal respuesta recibida de dirección */}
      <Modal
        open={showDirReplyModal}
        onClose={() => setShowDirReplyModal(false)}
        title="Subir respuesta final"
        size="sm"
        backdrop="blur"
        closeOnOverlayClick={true}
        footer={
          <Button
            variant="primary"
            onClick={async () => {
              setShowDirReplyModal(false)
              // Esperar a que el modal se cierre antes de hacer scroll
              setTimeout(() => {
                const el = document.getElementById('respuesta-final-section')
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  el.classList.add('bg-green-100', 'transition-colors')
                  setTimeout(() => {
                    el.classList.remove('bg-green-100')
                  }, 5000)
                }
              }, 300)
              // Actualizar estado
              try {
                setLoadingAction('dir_reply')
                const current = await getCase(id)
                await updateCase(id, {
                  status: 'respuesta direccion recibida',
                  direccionReplyAt: new Date().toISOString(),
                })
                await addEvent(id, {
                  type: 'status_change',
                  by: user?.uid ?? 'anon',
                  at: new Date().toISOString(),
                  payload: { from: current?.status, to: 'respuesta direccion recibida' },
                })
                setToast({ msg: 'Estado: Respuesta de Dirección registrada', type: 'success' })
                await after()
              } finally {
                setLoadingAction(null)
              }
            }}
          >
            Aceptar
          </Button>
        }
      >
        <div className="flex items-center gap-2">
          <Icon name="info" className="text-green-600" />
          <span className="text-green-700 font-semibold">
            Debe subir la respuesta final en la sección correspondiente.
          </span>
        </div>
      </Modal>
    </>
  )
}
