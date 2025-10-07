import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCase, getSector, getStaff, listSectors, updateCase } from '../services/oirsRepo'
import type { CaseEvent, OirsCase, Sector } from '../types/oirs'
import { fmt } from '../utils/date'
import SlaChip from '../components/ui/SlaChip'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../lib/firebase'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import BackButton from '../components/ui/BackButton'
import Section from '../components/ui/Section'
import Card from '../components/ui/Card'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import Icon from '../components/ui/Icon'
import QuickActions from '../components/QuickActions'
import FileSlot from '../components/ui/FileSlot'
import Modal from '../components/ui/Modal'
import Textarea from '../components/ui/Textarea'
import Loading from '../components/ui/Loading'
import CaseInfoPanel from '../components/CaseInfoPanel'

type AllegedStaffView = {
  id: string
  name: string
  role?: string | null
  sectorIds?: string[]
  sectorNames?: string[]
}

export default function CaseDetail() {
  const { id } = useParams()
  const [item, setItem] = useState<OirsCase | null>(null)
  const [events, setEvents] = useState<CaseEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [sectorName, setSectorName] = useState<string>('')
  const [allegedStaff, setAllegedStaff] = useState<AllegedStaffView[]>([])
  const [sectorLookup, setSectorLookup] = useState<Record<string, string>>({})
  // Hooks para edición de textos
  const [caseText, setCaseText] = useState('')
  const [descargoText, setDescargoText] = useState('')
  const [respuestaText, setRespuestaText] = useState('')
  const [saving, setSaving] = useState(false)
  const [editCaseText, setEditCaseText] = useState(false)
  const [editDescargoText, setEditDescargoText] = useState(false)
  const [editRespuestaText, setEditRespuestaText] = useState(false)
  // user no requerido aquí tras mover acciones a QuickActions

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!id) return
      setLoading(true)
      const c = await getCase(id)
      if (!mounted) return
      setItem(c)
      let sectorMap = sectorLookup
      if (Object.keys(sectorMap).length === 0) {
        try {
          const sectorList = await listSectors()
          sectorMap = Object.fromEntries(
            (sectorList ?? [])
              .filter((s): s is Sector => Boolean(s.id))
              .map((s) => [s.id as string, s.name])
          )
          if (mounted) setSectorLookup(sectorMap)
        } catch {
          sectorMap = {}
        }
      }
      // cargar nombre de sector si existe
      if (c?.sectorId) {
        const nameFromMap = sectorMap[c.sectorId]
        if (nameFromMap) {
          if (mounted) setSectorName(nameFromMap)
        } else {
          try {
            const s = await getSector(c.sectorId)
            if (s && mounted) {
              setSectorName(s.name)
              setSectorLookup((prev) => ({ ...prev, [s.id as string]: s.name }))
            }
          } catch {
            if (mounted) setSectorName('')
          }
        }
      } else if (mounted) {
        setSectorName('')
      }
      // cargar funcionarios aludidos (si existen ids)
      if (c?.allegedStaffIds && c.allegedStaffIds.length > 0) {
        try {
          const list: (AllegedStaffView | null)[] = await Promise.all(
            c.allegedStaffIds.map(async (sid): Promise<AllegedStaffView | null> => {
              try {
                const st = await getStaff(sid)
                if (!st) return null
                const sectorIds = st.sectorIds ?? []
                const sectorNames = sectorIds
                  .map((sectorId) => sectorMap[sectorId])
                  .filter((name): name is string => Boolean(name))
                return {
                  id: st.id ?? sid,
                  name: st.name,
                  role: st.role ?? undefined,
                  sectorIds,
                  sectorNames,
                }
              } catch {
                return null
              }
            })
          )
          if (mounted) {
            const normalized = list.filter((value): value is AllegedStaffView => value !== null)
            setAllegedStaff(normalized)
          }
        } catch {
          if (mounted) setAllegedStaff([])
        }
      } else {
        setAllegedStaff([])
      }
      // estado actual ya viene en item, no se usa control local de select tras migración
      // cargar timeline
      await loadEvents(id)
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [id])

  async function loadEvents(caseId: string) {
    const ref = collection(db, 'oirs_cases', caseId, 'events')
    const snap = await getDocs(query(ref, orderBy('at', 'desc')))
    setEvents(
      snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CaseEvent, 'id'>) })) as CaseEvent[]
    )
  }

  async function refreshAll() {
    if (!id) return
    const fresh = await getCase(id)
    setItem(fresh)
    await loadEvents(id)
  }

  if (!id) return <div className="p-4">ID no provisto</div>

  // Actualizar los valores de los campos cuando se abre el modal
  useEffect(() => {
    if (editCaseText) setCaseText(item?.response?.caseText ?? '')
  }, [editCaseText])
  useEffect(() => {
    if (editDescargoText) setDescargoText(item?.staffReplyText ?? '')
  }, [editDescargoText])
  useEffect(() => {
    if (editRespuestaText) setRespuestaText(item?.response?.responseText ?? '')
  }, [editRespuestaText])

  // Mostrar un indicador de carga mientras se cargan los detalles del caso
  if (loading) {
    return <Loading text="Cargando detalles del caso..." />
  }
  if (!item)
    return (
      <div className="mx-auto w-full max-w-page px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader title="Caso no encontrado" />
      </div>
    )

  // Acciones ahora están en QuickActions

  return (
    <div className="mx-auto w-full max-w-page space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        breadcrumbs={
          <Breadcrumbs
            items={[{ label: 'Casos', to: '/cases' }, { label: `Caso ${item.folio || item.id}` }]}
          />
        }
        title={
          <div className="inline-flex items-center gap-2">
            <Icon name="document" />
            <span>Caso {item.folio || item.id}</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <BackButton fallback="/cases" />
            <SlaChip value={item.sla} />
            <Button as={Link} to={`/cases/${id}/edit`} variant="outline" size="sm">
              Editar
            </Button>
          </div>
        }
      />
      {/* Modal editar texto caso original */}
      <Modal
        open={editCaseText}
        onClose={() => setEditCaseText(false)}
        title="Editar texto del caso original"
        size="md"
        backdrop="blur"
        fullOnMobile
        closeOnOverlayClick={false}
        footer={
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="md"
              className="w-full sm:w-auto"
              onClick={() => setEditCaseText(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto"
              disabled={saving || !caseText.trim()}
              onClick={async () => {
                setSaving(true)
                await updateCase(id, { response: { ...item.response, caseText: caseText.trim() } })
                setSaving(false)
                setEditCaseText(false)
                setItem(await getCase(id))
              }}
            >
              Guardar
            </Button>
          </div>
        }
      >
        <div className="flex flex-col h-[60vh] max-h-[500px] min-h-[300px]">
          <Textarea
            autoFocus
            value={caseText}
            onChange={(e) => setCaseText(e.target.value)}
            placeholder="Escribe aquí el texto del caso original..."
            className="flex-1 resize-none text-base w-full max-w-2xl mx-auto"
            style={{ minHeight: '120px' }}
          />
        </div>
      </Modal>

      {/* Modal editar texto descargo */}
      <Modal
        open={editDescargoText}
        onClose={() => setEditDescargoText(false)}
        title="Editar texto de descargos"
        size="md"
        backdrop="blur"
        fullOnMobile
        closeOnOverlayClick={false}
        footer={
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="md"
              className="w-full sm:w-auto"
              onClick={() => setEditDescargoText(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto"
              disabled={saving || !descargoText.trim()}
              onClick={async () => {
                setSaving(true)
                await updateCase(id, { staffReplyText: descargoText.trim() })
                setSaving(false)
                setEditDescargoText(false)
                setItem(await getCase(id))
              }}
            >
              Guardar
            </Button>
          </div>
        }
      >
        <div className="flex flex-col h-[60vh] max-h-[500px] min-h-[300px]">
          <Textarea
            autoFocus
            value={descargoText}
            onChange={(e) => setDescargoText(e.target.value)}
            placeholder="Escribe aquí el texto de descargos..."
            className="flex-1 resize-none text-base w-full max-w-2xl mx-auto"
            style={{ minHeight: '120px' }}
          />
        </div>
      </Modal>

      {/* Modal editar texto respuesta final */}
      <Modal
        open={editRespuestaText}
        onClose={() => setEditRespuestaText(false)}
        title="Editar texto de respuesta final"
        size="md"
        backdrop="blur"
        fullOnMobile
        closeOnOverlayClick={false}
        footer={
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="md"
              className="w-full sm:w-auto"
              onClick={() => setEditRespuestaText(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto"
              disabled={saving || !respuestaText.trim()}
              onClick={async () => {
                setSaving(true)
                await updateCase(id, {
                  response: { ...item.response, responseText: respuestaText.trim() },
                })
                setSaving(false)
                setEditRespuestaText(false)
                setItem(await getCase(id))
              }}
            >
              Guardar
            </Button>
          </div>
        }
      >
        <div className="flex flex-col h-[60vh] max-h-[500px] min-h-[300px]">
          <Textarea
            autoFocus
            value={respuestaText}
            onChange={(e) => setRespuestaText(e.target.value)}
            placeholder="Escribe aquí el texto de la respuesta final..."
            className="flex-1 resize-none text-base w-full max-w-2xl mx-auto"
            style={{ minHeight: '120px' }}
          />
        </div>
      </Modal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acciones rápidas */}
        <Section title="Acciones rápidas" description="Cambios de estado y hitos operativos">
          <Card>
            <div className="flex flex-col gap-2">
              <QuickActions
                id={id}
                onChanged={async () => {
                  const fresh = await getCase(id)
                  setItem(fresh)
                  await loadEvents(id)
                }}
              />
            </div>
          </Card>
        </Section>
        {/* Panel unificado de información */}
        <Section title="Información del caso" description="Resumen, funcionarios y paciente">
          <CaseInfoPanel item={item} sectorName={sectorName} allegedStaff={allegedStaff} />
        </Section>
      </div>

      <Section title="Respuesta" description="Texto y archivos por bloque">
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ minHeight: '370px' }}>
            {/* Componente genérico para cada bloque */}
            {[
              {
                badgeClass:
                  'inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700 ring-1 ring-blue-100',
                icon: <Icon name="document" />,
                label: 'Caso original',
                textLabel: 'Texto del caso',
                text: item.response?.caseText,
                onEdit: () => setEditCaseText(true),
                editLabel: item.response?.caseText ? 'Editar' : 'Agregar',
                file: item.caseOriginalFile,
                fileLabel: 'Archivo adjunto',
                fileField: 'caseOriginalFile',
              },
              {
                badgeClass:
                  'inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-amber-100',
                icon: <Icon name="chat-bubble" />,
                label: 'Descargos',
                textLabel: 'Texto del descargo',
                text: item.staffReplyText,
                onEdit: () => setEditDescargoText(true),
                editLabel: item.staffReplyText ? 'Editar' : 'Agregar',
                file: item.staffReplyFile,
                fileLabel: 'Archivo descargos',
                fileField: 'staffReplyFile',
              },
              {
                badgeClass:
                  'inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-100',
                icon: <Icon name="check-circle" />,
                label: 'Respuesta final',
                textLabel: 'Propuesta de respuesta',
                text: item.response?.responseText,
                onEdit: () => setEditRespuestaText(true),
                editLabel: item.response?.responseText ? 'Editar' : 'Agregar',
                file: item.responseMainFile,
                fileLabel: 'Archivo de respuesta final',
                fileField: 'responseMainFile',
              },
            ].map((block) => (
              <div
                key={block.label}
                className="relative flex h-full min-h-[360px] flex-col gap-6 rounded-2xl border border-slate-200 bg-gradient-to-b from-white via-white to-slate-50/60 p-5 shadow-elevation1"
              >
                <div className="mb-3 flex items-start justify-between">
                  <span className={block.badgeClass}>
                    {block.icon} {block.label}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Icon name="edit" />}
                    onClick={block.onEdit}
                    className="px-2 text-xs sm:text-sm"
                  >
                    {block.editLabel}
                  </Button>
                </div>
                <div className="flex flex-1 flex-col gap-5">
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      {block.textLabel}
                    </div>
                    <div className="mt-1 max-h-[120px] min-h-[120px] overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-white/80 p-2 text-sm">
                      {block.text ? (
                        <>{block.text}</>
                      ) : (
                        <span className="text-slate-400">— Sin texto —</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-auto">
                    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/80 p-4">
                      <div className="flex flex-col gap-1">
                        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                          {block.fileLabel}
                        </div>
                        {block.file?.name ? (
                          <>
                            <span
                              className="truncate text-sm font-medium text-slate-800"
                              title={block.file.name}
                            >
                              {block.file.name}
                            </span>
                            {typeof block.file.size === 'number' && (
                              <span className="text-xs text-slate-500">
                                {Math.max(1, Math.round(block.file.size / 1024))} KB
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-slate-500">Sin archivo</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {block.file?.url && (
                          <Button
                            as="a"
                            href={block.file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="outline"
                            size="sm"
                            leftIcon={<Icon name="download" />}
                          >
                            Descargar
                          </Button>
                        )}
                        <FileSlot
                          caseId={id}
                          field={block.fileField as any}
                          file={block.file}
                          onChanged={refreshAll}
                          showReplaceOnly
                        />
                        {block.file?.name && (
                          <FileSlot
                            caseId={id}
                            field={block.fileField as any}
                            file={block.file}
                            onChanged={refreshAll}
                            showRemoveOnly
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      <Section title="Timeline" description="Historial de eventos (más reciente primero)">
        <Card>
          <div className="space-y-3">
            {events.length === 0 ? (
              <div className="text-gray-600">Sin eventos</div>
            ) : (
              events.map((e) => {
                const meta = eventMeta(e)
                return (
                  <div
                    key={e.id ?? `${e.type}-${e.at}`}
                    className="flex items-start gap-3 rounded-md border p-3 hover:bg-gray-50"
                  >
                    <div
                      className={[
                        'mt-0.5 flex h-8 w-8 items-center justify-center rounded-full',
                        meta.bg,
                      ].join(' ')}
                    >
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={[
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            meta.badge,
                          ].join(' ')}
                        >
                          {meta.label}
                        </span>
                        <span className="text-xs text-gray-600">{fmt(e.at)}</span>
                      </div>
                      {meta.detail && (
                        <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">
                          {meta.detail}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </Section>
    </div>
  )
}
function eventMeta(e: CaseEvent) {
  // Mapping de eventos a UI en español
  switch (e.type) {
    case 'status_change': {
      const to = typeof e.payload?.to === 'string' ? (e.payload.to as string) : ''
      const label = `Cambio de estado: ${to || '—'}`
      return {
        label,
        icon: <Icon name="check-circle" />,
        bg: 'bg-green-50 text-green-700',
        badge: 'bg-green-100 text-green-800',
        detail:
          to && e.payload && 'from' in e.payload
            ? `De “${String((e.payload as any).from)}” a “${to}”.`
            : undefined,
      }
    }
    case 'send_to_staff':
      return {
        label: 'Enviado a funcionario',
        icon: <Icon name="send" />,
        bg: 'bg-blue-50 text-blue-700',
        badge: 'bg-blue-100 text-blue-800',
        detail: 'Se envió el caso al funcionario aludido.',
      }
    case 'send_to_direccion':
      return {
        label: 'Enviado a Dirección',
        icon: <Icon name="send" />,
        bg: 'bg-blue-50 text-blue-700',
        badge: 'bg-blue-100 text-blue-800',
        detail: 'Se envió el caso a Dirección.',
      }
    case 'receive_direccion_reply':
      return {
        label: 'Respuesta recibida de Dirección',
        icon: <Icon name="chat-bubble" />,
        bg: 'bg-purple-50 text-purple-700',
        badge: 'bg-purple-100 text-purple-800',
        detail: 'Se registró la respuesta de Dirección.',
      }
    case 'note':
      return {
        label: 'Nota',
        icon: <Icon name="document" />,
        bg: 'bg-gray-50 text-gray-700',
        badge: 'bg-gray-100 text-gray-800',
        detail: typeof e.payload?.msg === 'string' ? e.payload.msg : undefined,
      }
    case 'file_upload': {
      const field = typeof e.payload?.field === 'string' ? (e.payload.field as string) : undefined
      const action = typeof e.payload?.action === 'string' ? (e.payload.action as string) : 'upload'
      const fname = typeof e.payload?.name === 'string' ? (e.payload.name as string) : undefined
      const fieldMap: Record<string, string> = {
        caseOriginalFile: 'Caso original',
        staffReplyFile: 'Descargos funcionario',
        responseMainFile: 'Respuesta final',
      }
      const actionLabel = action === 'remove' ? 'Archivo eliminado' : 'Archivo actualizado'
      const detail = [field ? (fieldMap[field] ?? field) : undefined, fname]
        .filter(Boolean)
        .join(' · ')
      return {
        label: actionLabel,
        icon: <Icon name="document" />,
        bg: 'bg-gray-50 text-gray-700',
        badge: 'bg-gray-100 text-gray-800',
        detail: detail || undefined,
      }
    }
    default:
      return {
        label: e.type,
        icon: <Icon name="document" />,
        bg: 'bg-gray-50 text-gray-700',
        badge: 'bg-gray-100 text-gray-800',
        detail: e.payload ? JSON.stringify(e.payload) : undefined,
      }
  }
}
