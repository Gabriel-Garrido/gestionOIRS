import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  oirsCaseSchema,
  requestTypes,
  intakeChannels,
  topics,
  type OirsCase,
  type CaseStatus,
} from '../types/oirs'
import { addEvent, createCase, getCase, updateCase, listSectors } from '../services/oirsRepo'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  addBusinessDaysIntl,
  CL_2025_HOLIDAYS,
  formatDateLocalYmd,
  normalizeDateInput,
  toDateInputValue,
} from '../utils/date'
import { uploadFile } from '../services/firebase/storage'
import SelectTopic from '../components/SelectTopic'
import SelectStaffMulti from '../components/SelectStaffMulti'
import NewStaffModal from '../components/NewStaffModal'
import { getHolidaysDoc } from '../services/oirsRepo'
import { fetchChileHolidays } from '../services/holidays'
import Button from '../components/ui/Button'
import Section from '../components/ui/Section'
import PageHeader from '../components/ui/PageHeader'
import BackButton from '../components/ui/BackButton'
import FormSection from '../components/ui/FormSection'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Toast from '../components/ui/Toast'
import { caseStatusLabel } from '../utils/labels'
import Loading from '../components/ui/Loading'

const baseSchema = oirsCaseSchema.pick({
  folio: true,
  requestType: true,
  intakeChannel: true,
  topic: true,
  sectorId: true,
  gender: true,
  migratoryStatus: true,
  receivedAt: true,
  dueAt: true,
  respondedAt: true,
  response: true,
  allegedStaffIds: true,
  allegedStaff: true,
  // eliminamos campos de fechas/eventos del formulario (se registran vía Acciones rápidas)
  status: true, // se maneja internamente; no input visible
  notes: true,
})

const schema = baseSchema.extend({
  folio: z.string().min(1, 'El folio es obligatorio'),
  sectorId: z.string().min(1, 'Seleccione un sector').default(''),
  receivedAt: z.string().min(1, 'Selecciona una fecha de recibido.'),
  topic: z.enum(topics),
  patientName: z.string().optional(),
  patientRut: z.string().optional(),
  patientEmail: z.string().optional(),
  patientAddress: z.string().optional(),
  patientNameNotProvided: z.boolean().optional(),
  patientRutNotProvided: z.boolean().optional(),
  patientEmailNotProvided: z.boolean().optional(),
  patientAddressNotProvided: z.boolean().optional(),
  googleDriveFolder: z.string().url().optional(),
})

type FormData = z.infer<typeof schema>

export default function CaseForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { user } = useAuth()
  const todayYmd = formatDateLocalYmd(new Date())

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      folio: '',
      requestType: isEdit ? undefined : ('' as unknown as any),
      intakeChannel: isEdit ? undefined : ('' as unknown as any),
      gender: isEdit ? undefined : ('' as unknown as any),
      migratoryStatus: isEdit ? undefined : ('' as unknown as any),
      sectorId: isEdit ? undefined : ('' as unknown as any),
      receivedAt: '', // Eliminar la fecha por defecto
      dueAt: '',
      respondedAt: null,
      response: {},
      allegedStaffIds: [],
      status: 'en revision',
    },
  })

  // Estados locales
  const [pendingFiles] = useState<File[]>([])
  const [toast, setToast] = useState<null | { msg: string; type: 'success' | 'error' | 'info' }>(
    null
  )
  const [descargoOpen, setDescargoOpen] = useState(false)
  const [descargoText, setDescargoText] = useState('')
  const [respuestaOpen, setRespuestaOpen] = useState(false)
  const [tipoRespuesta, setTipoRespuesta] = useState<
    '' | 'correo' | 'carta' | 'plataforma' | 'otro'
  >('')
  const [openNewStaff, setOpenNewStaff] = useState(false)
  const [staffRefreshKey, setStaffRefreshKey] = useState(0)
  const [holidays, setHolidays] = useState<Set<string>>(CL_2025_HOLIDAYS)
  const [sectors, setSectors] = useState<{ id: string; name: string }[]>([])

  // Watchers
  const receivedAt = watch('receivedAt') as string | undefined
  const reqType = watch('requestType') as OirsCase['requestType'] | undefined
  const selectedStaffIds = (watch('allegedStaffIds') as string[] | undefined) ?? []
  const watchRequestType = watch('requestType') as OirsCase['requestType'] | ''

  // Cargar feriados: Firestore -> API externa -> fallback constantes
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const fromDb = await getHolidaysDoc('CL-2025')
        if (active && fromDb?.length) {
          setHolidays(new Set(fromDb))
          return
        }
      } catch {}
      try {
        const fromApi = await fetchChileHolidays(2025)
        if (active && fromApi?.length) {
          setHolidays(new Set(fromApi))
          return
        }
      } catch {}
      if (active) setHolidays(CL_2025_HOLIDAYS)
    })()
    return () => {
      active = false
    }
  }, [])

  // Recalcular fecha de vencimiento según días hábiles de Chile 2025 (sólo en creación)
  useEffect(() => {
    if (!receivedAt || !reqType || isEdit) return
    const businessDays = reqType === 'felicitacion' ? 20 : 15
    const nextDue = addBusinessDaysIntl(receivedAt, businessDays, '0000011', holidays)
    setValue('dueAt', nextDue.slice(0, 10))
  }, [receivedAt, reqType, setValue, holidays, isEdit])

  // Regla de Tema según Tipo
  useEffect(() => {
    if (!isEdit) {
      if (watchRequestType && watchRequestType !== 'reclamo') {
        setValue('topic', 'No aplica' as any, { shouldValidate: true })
      } else if (watchRequestType === 'reclamo') {
        // Si estaba en 'No aplica', limpiar para obligar selección válida
        if ((watch('topic') as any) === 'No aplica') setValue('topic', '' as any)
      }
    }
  }, [watchRequestType, isEdit, setValue])

  // Modo edición: cargar caso
  useEffect(() => {
    if (isEdit && id) {
      getCase(id).then((c) => {
        if (!c) return
        const toYmd = (s?: string | null) => toDateInputValue(s)
        reset({
          ...(c as unknown as FormData),
          folio: (c.folio ?? '') as any,
          receivedAt: toYmd(c.receivedAt),
          dueAt: toYmd(c.dueAt),
        } as unknown as FormData)
      })
    }
  }, [id, isEdit, reset])

  // Cargar sectores
  useEffect(() => {
    listSectors().then((data) =>
      setSectors((data ?? []).map((s) => ({ id: s.id ?? '', name: s.name })))
    )
  }, [])

  // Agregué validación para comprobar campos vacíos al presionar "Finalizar"
  const validateForm = (data: FormData) => {
    const errors: string[] = []

    if (!data.folio || !data.folio.trim()) {
      errors.push('El folio es obligatorio.')
    }

    if (!data.requestType) {
      errors.push('El campo "Tipo" es obligatorio.')
    }

    if (!data.intakeChannel) {
      errors.push('El campo "Canal" es obligatorio.')
    }

    if (!data.sectorId) {
      errors.push('Debe seleccionar un sector.')
    }

    if (!data.gender) {
      errors.push('Debe seleccionar un género.')
    }

    if (!data.migratoryStatus) {
      errors.push('Debe seleccionar una condición migratoria.')
    }

    if (!data.receivedAt) {
      errors.push('Debe ingresar la fecha de recibido.')
    }

    if (!data.dueAt) {
      errors.push('Debe ingresar la fecha de vencimiento.')
    }

    if (data.requestType === 'reclamo') {
      if (!data.topic || data.topic.trim() === '') {
        errors.push('Debe seleccionar un tema si el tipo es reclamo.')
      } else if (data.topic === 'No aplica') {
        errors.push('El tema no puede ser "No aplica" si el tipo es reclamo.')
      }
    }

    return errors
  }

  const onSubmit = async (data: FormData) => {
    const validationErrors = validateForm(data)
    if (validationErrors.length > 0) {
      setToast({
        msg: validationErrors.join(' '),
        type: 'error',
      })
      return
    }

    if (!data.receivedAt || !data.dueAt) {
      setToast({
        msg: 'Debe ingresar fecha de recibido para calcular el vencimiento.',
        type: 'error',
      })
      return
    }
    const normalizedReceivedAt = normalizeDateInput(data.receivedAt)
    const normalizedDueAt = normalizeDateInput(data.dueAt)
    if (!normalizedReceivedAt || !normalizedDueAt) {
      setToast({
        msg: 'No se pudo interpretar la fecha ingresada. Usa el formato AAAA-MM-DD.',
        type: 'error',
      })
      return
    }
    data.receivedAt = normalizedReceivedAt
    data.dueAt = normalizedDueAt
    data.respondedAt = normalizeDateInput(data.respondedAt) ?? null

    if (isEdit && id) {
      const prev = await getCase(id)
      // Subir archivos a carpeta del caso y actualizar
      const uploaded: {
        name: string
        path: string
        mime: string
        size: number
        url?: string
      }[] = []
      for (const f of pendingFiles) {
        const up = await uploadFile(`cases/${id}`, f)
        uploaded.push({ name: f.name, path: up.path, mime: f.type, size: f.size, url: up.url })
      }
      // Corregí la asignación de `files` para evitar valores `undefined`
      const next: Partial<OirsCase> = {
        ...data,
        response: {
          ...data.response,
          ...(uploaded.length ? { files: uploaded } : {}),
        },
      }
      try {
        await updateCase(id, next)
      } catch (e: unknown) {
        const msg =
          typeof e === 'object' && e && 'message' in e ? String((e as any).message) : String(e)
        if (msg.includes('Folio ya existe')) {
          setToast({ msg, type: 'error' })
          return
        }
        setToast({ msg: 'Error al guardar el caso', type: 'error' })
        return
      }
      if (prev && data.status && data.status !== prev.status) {
        await addEvent(id, {
          type: 'status_change',
          by: user?.uid ?? 'anon',
          at: new Date().toISOString(),
          payload: { from: prev.status, to: data.status },
        })
      }
      if (uploaded.length) {
        await addEvent(id, {
          type: 'file_upload',
          by: user?.uid ?? 'anon',
          at: new Date().toISOString(),
          payload: { count: uploaded.length },
        })
      }
      nav(`/cases/${id}`)
      return
    }

    // Crear caso primero
    const base: Omit<OirsCase, 'id' | 'sla' | 'createdAt' | 'updatedAt' | 'createdBy'> & {
      createdBy: string
    } = {
      ...data,
      createdBy: user?.uid ?? 'anon',
    }
    let newId: string
    try {
      newId = await createCase(base)
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e && 'message' in e ? String((e as any).message) : String(e)
      if (msg.includes('Folio ya existe')) {
        setToast({ msg, type: 'error' })
        return
      }
      setToast({ msg: 'Error al crear el caso', type: 'error' })
      return
    }
    // Subir archivos si hay y actualizar
    if (pendingFiles.length) {
      const uploaded: {
        name: string
        path: string
        mime: string
        size: number
        url?: string
      }[] = []
      for (const f of pendingFiles) {
        const up = await uploadFile(`cases/${newId}`, f)
        uploaded.push({ name: f.name, path: up.path, mime: f.type, size: f.size, url: up.url })
      }
      await updateCase(newId, { response: { ...data.response, files: uploaded } })
      await addEvent(newId, {
        type: 'file_upload',
        by: user?.uid ?? 'anon',
        at: new Date().toISOString(),
        payload: { count: uploaded.length },
      })
    }
    nav(`/cases/${newId}`)
  }

  // Unificar handler de envío para usar en botón y en form oculto
  const submit = handleSubmit(onSubmit)

  // Agregar botón para establecer la fecha de hoy
  const setTodayDate = () => {
    setValue('receivedAt', todayYmd)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={isEdit ? 'Editar caso' : 'Nuevo caso'}
        actions={<BackButton fallback="/cases" />}
        subtitle={
          isEdit ? (
            <span>
              Estado actual:{' '}
              <Badge variant="muted">
                {caseStatusLabel[(watch('status') || 'en revision') as CaseStatus]}
              </Badge>
            </span>
          ) : undefined
        }
      />

      <div className="mx-auto w-full max-w-5xl xl:max-w-6xl space-y-4">
        <FormSection title="Datos generales" columns={2}>
          <div>
            <label className="block text-sm font-medium">Folio</label>
            <Input
              {...register('folio')}
              placeholder="Ingresa el folio"
              className="w-full border border-gray-300 rounded-md px-2 py-1"
            />
            {errors.folio && (
              <p className="mt-1 text-sm text-red-600">{errors.folio.message as string}</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Carpeta Google Drive</label>
            <Input
              {...register('googleDriveFolder')}
              type="url"
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full border border-gray-300 rounded-md px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Tipo</label>
            <Select
              value={watch('requestType') ?? ''}
              onChange={(e) => setValue('requestType', e.target.value as any)}
            >
              <option value="">Selecciona el tipo de solicitud…</option>
              {requestTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            {errors.requestType && (
              <p className="mt-1 text-sm text-red-600">Selecciona un tipo de solicitud.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">Canal</label>
            <Select
              value={watch('intakeChannel') ?? ''}
              onChange={(e) => setValue('intakeChannel', e.target.value as any)}
            >
              <option value="">Selecciona el canal de ingreso…</option>
              {intakeChannels.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            {errors.intakeChannel && (
              <p className="mt-1 text-sm text-red-600">Selecciona un canal de ingreso.</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Tema</label>
            <SelectTopic
              value={
                watchRequestType === 'reclamo' ? (watch('topic') as any) : ('No aplica' as any)
              }
              onChange={(v) => setValue('topic', v, { shouldValidate: true })}
              disabled={watchRequestType !== 'reclamo'}
              hideNoAplica={watchRequestType === 'reclamo'}
              className="h-10 w-full"
            />
            {(errors.topic ||
              (watchRequestType === 'reclamo' &&
                (!watch('topic') || watch('topic') === 'No aplica'))) && (
              <p className="mt-1 text-sm text-red-600">
                {!watch('topic') || watch('topic') === 'No aplica'
                  ? 'Debes seleccionar un tema válido si el tipo es reclamo.'
                  : errors.topic?.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">Sector</label>
            <Select {...register('sectorId')}>
              <option value="">Selecciona el sector correspondiente…</option>
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </Select>
            {errors.sectorId && <p className="mt-1 text-sm text-red-600">Selecciona un sector.</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Género</label>
            <Select {...register('gender')}>
              <option value="">Selecciona el género…</option>
              {['femenino', 'masculino', 'trans masculino', 'trans femenino', 'no binario'].map(
                (t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                )
              )}
            </Select>
            {errors.gender && <p className="mt-1 text-sm text-red-600">Selecciona un género.</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Condición migratoria</label>
            <Select {...register('migratoryStatus')}>
              <option value="">Selecciona la condición migratoria…</option>
              {['chileno', 'migrante'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            {errors.migratoryStatus && (
              <p className="mt-1 text-sm text-red-600">Selecciona una condición migratoria.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">Recibido</label>
            <div className="flex items-center gap-2">
              <Input
                {...register('receivedAt', {
                  required: 'Selecciona una fecha de recibido.',
                  validate: (value) => value !== '' || 'Selecciona una fecha válida.',
                })}
                type="date"
                className={`flex-1 border ${errors.receivedAt ? 'border-red-600 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              />
              <Button
                type="button"
                onClick={setTodayDate}
                className="bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Hoy
              </Button>
            </div>
            {errors.receivedAt && (
              <p className="mt-1 text-sm text-red-600">{errors.receivedAt.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">Vence</label>
            <Input type="date" readOnly {...register('dueAt')} />
          </div>
        </FormSection>

        <FormSection title="Información del paciente" columns={2}>
          <div>
            <label className="block text-sm font-medium">Nombre</label>
            <div className="flex items-center gap-2">
              <Input
                {...register('patientName')}
                type="text"
                placeholder="Ingrese el nombre del paciente"
                className={`flex-1 border ${errors.patientName ? 'border-red-600 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              />
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  {...register('patientNameNotProvided')}
                  onChange={(e) => {
                    if (e.target.checked) setValue('patientName', '')
                  }}
                />
                No proporcionado
              </label>
            </div>
            {errors.patientName && (
              <p className="mt-1 text-sm text-red-600">{errors.patientName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">RUT</label>
            <div className="flex items-center gap-2">
              <Input
                {...register('patientRut')}
                type="text"
                placeholder="Ingrese el RUT del paciente"
                className={`flex-1 border ${errors.patientRut ? 'border-red-600 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              />
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  {...register('patientRutNotProvided')}
                  onChange={(e) => {
                    if (e.target.checked) setValue('patientRut', '')
                  }}
                />
                No proporcionado
              </label>
            </div>
            {errors.patientRut && (
              <p className="mt-1 text-sm text-red-600">{errors.patientRut.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Correo Electrónico</label>
            <div className="flex items-center gap-2">
              <Input
                {...register('patientEmail')}
                type="email"
                placeholder="Ingrese el correo electrónico del paciente"
                className={`flex-1 border ${errors.patientEmail ? 'border-red-600 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              />
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  {...register('patientEmailNotProvided')}
                  onChange={(e) => {
                    if (e.target.checked) setValue('patientEmail', '')
                  }}
                />
                No proporcionado
              </label>
            </div>
            {errors.patientEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.patientEmail.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Dirección</label>
            <div className="flex items-center gap-2">
              <Input
                {...register('patientAddress')}
                type="text"
                placeholder="Ingrese la dirección del paciente"
                className={`flex-1 border ${errors.patientAddress ? 'border-red-600 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              />
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  {...register('patientAddressNotProvided')}
                  onChange={(e) => {
                    if (e.target.checked) setValue('patientAddress', '')
                  }}
                />
                No proporcionado
              </label>
            </div>
            {errors.patientAddress && (
              <p className="mt-1 text-sm text-red-600">{errors.patientAddress.message}</p>
            )}
          </div>
        </FormSection>

        <Section
          title="Funcionarios aludidos"
          actions={<Button onClick={() => setOpenNewStaff(true)}>Nuevo funcionario</Button>}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Funcionario(s) aludido(s)</label>
              <SelectStaffMulti
                key={`staff-${staffRefreshKey}`}
                value={selectedStaffIds}
                onChange={(v) => setValue('allegedStaffIds', v)}
              />
            </div>
          </div>
        </Section>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => nav(-1)}>
            Cancelar
          </Button>
          <Button
            loading={isSubmitting}
            disabled={isSubmitting}
            onClick={submit}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Finalizar
          </Button>
        </div>
      </div>

      <NewStaffModal
        open={openNewStaff}
        onClose={() => setOpenNewStaff(false)}
        onCreated={(newId) => {
          const current = (watch('allegedStaffIds') as string[] | undefined) ?? []
          const next = Array.from(new Set([...current, newId]))
          setValue('allegedStaffIds', next)
          setStaffRefreshKey((k) => k + 1)
          setOpenNewStaff(false)
        }}
      />

      <form className="hidden" onSubmit={submit} />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

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
                if (!isEdit || !id) return
                await updateCase(id, {
                  status: 'descargos recibidos',
                  staffReplyAt: new Date().toISOString(),
                  staffReplyText: descargoText || undefined,
                })
                await addEvent(id, {
                  type: 'status_change',
                  by: user?.uid ?? 'anon',
                  at: new Date().toISOString(),
                  payload: { to: 'descargos recibidos' },
                })
                setToast({ msg: 'Descargos registrados', type: 'success' })
                setValue('status', 'descargos recibidos' as CaseStatus)
                setDescargoOpen(false)
                setDescargoText('')
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
            rows={4}
            value={descargoText}
            onChange={(e) => setDescargoText(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        open={respuestaOpen}
        onClose={() => setRespuestaOpen(false)}
        title="Enviar respuesta al usuario"
        size="md"
        backdrop="blur"
        closeOnOverlayClick={false}
        fullOnMobile
        footer={
          <>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRespuestaOpen(false)}>
                Cancelar
              </Button>
              <Button
                loading={isSubmitting}
                disabled={!tipoRespuesta || isSubmitting}
                onClick={async () => {
                  if (!isEdit || !id) return
                  const type: OirsCase['response']['type'] = tipoRespuesta
                    ? tipoRespuesta
                    : undefined
                  await updateCase(id, {
                    status: 'respuesta enviada',
                    respondedAt: new Date().toISOString(),
                    response: { ...watch('response'), type },
                  })
                  await addEvent(id, {
                    type: 'status_change',
                    by: user?.uid ?? 'anon',
                    at: new Date().toISOString(),
                    payload: { to: 'respuesta enviada', responseType: type },
                  })
                  setToast({ msg: 'Respuesta enviada al usuario', type: 'success' })
                  setValue('status', 'respuesta enviada' as CaseStatus)
                  if (type) setValue('response.type', type)
                  setRespuestaOpen(false)
                  setTipoRespuesta('')
                }}
              >
                Enviar respuesta
              </Button>
            </div>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Puedes añadir un resumen del descargo recibido.</p>
          <Textarea
            rows={4}
            value={descargoText}
            onChange={(e) => setDescargoText(e.target.value)}
          />
        </div>
      </Modal>

      {/* Agregado un indicador de carga mientras se envía el formulario */}
      {isSubmitting && <Loading text="Guardando caso..." />}
    </div>
  )
}
