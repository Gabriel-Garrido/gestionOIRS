import { z } from 'zod'

// Tipos modelo OIRS
export const requestTypes = [
  'reclamo',
  'solicitud',
  'felicitacion',
  'sugerencia',
  'consulta',
] as const

export const intakeChannels = [
  'plataforma',
  'formulario',
  'superintendencia',
  'correo',
  'alo santiago',
  'carta presidente',
  'otro',
] as const

export const caseStatuses = [
  'en revision',
  'enviado a funcionario',
  'descargos recibidos',
  'enviado a direccion',
  'respuesta direccion recibida',
  'respuesta enviada',
  'archivado',
] as const

export const slaStatuses = [
  'dentro de plazo',
  'fuera de plazo',
  'pendiente dentro de plazo',
  'pendiente fuera de plazo',
] as const

export type RequestType = (typeof requestTypes)[number]
export type IntakeChannel = (typeof intakeChannels)[number]
export type CaseStatus = (typeof caseStatuses)[number]
export type SlaStatus = (typeof slaStatuses)[number]

export type CaseEvent = {
  id?: string
  type:
    | 'status_change'
    | 'note'
    | 'file_upload'
    | 'send_to_staff'
    | 'send_to_direccion'
    | 'receive_direccion_reply'
  by: string
  at: string // ISO
  payload?: Record<string, unknown>
}

export type FileMeta = { name: string; path: string; mime: string; size: number; url?: string }

// Tópicos (lista basada en la especificación adjunta)
export const topics = [
  'No aplica',
  'Trato no amable, digno ni respetuoso',
  'Trato discriminatorio',
  'Trato con falta de privacidad',
  'Trato con falta de confidencialidad',
  'Trato sin pertinencia cultural en la atención',
  'Trato sin condiciones para el acompañamiento',
  'Competencia técnica diagnóstico',
  'Competencia técnica tratamiento farmacológico / clínico / cirugía',
  'Eventos adversos',
  'Infraestructura baños públicos',
  'Infraestructura condiciones salas de espera, box de atención o sala de hospitalización',
  'Infraestructura accesibilidad universal',
  'Infraestructura comodidad y seguridad de camas, cunas y camillas de traslado',
  'Condiciones de infraestructura para el acompañamiento',
  'Tiempo de espera (En sala de espera)',
  'Tiempo de espera, por consulta especialidad (Por lista de espera)',
  'Tiempo de espera, por procedimiento (Lista de espera)',
  'Tiempo de espera , por cirugía (Lista de espera)',
  'Información del estado de salud',
  'Información y trámites institucionales',
  'Información sobre consentimiento informado',
  'Información sobre acceso a ficha clínica',
  'Información sobre acceso a médico tratante',
  'Información de egreso o traslado',
  'Procedimientos administrativos en el proceso de admisión y recaudación',
  'Procedimientos administrativos al egreso',
  'Procedimientos administrativos de referencia y/o derivación',
  'Procedimientos administrativos de Ficha extraviada o perdida',
  'Procedimientos administrativos en agendamiento y reagendamiento de atención',
  'Procedimientos administrativos en suspensión de atención',
  'Procedimientos administrativos en suspensión de cirugía programada',
  'Procedimientos administrativos con acceso a medicamentos',
  'Probidad administrativa',
  'Incumplimiento Garantías Explícitas en Salud (GES)',
  'Vulneración de derechos sexuales y reproductivos',
  'Reclamos asociados a violencia gineco obstétrica',
  'Incumplimiento Ley Mila N°21.372',
  'Incumplimiento Ley Dominga N° 21.371',
  'Incumplimiento de garantías Ley Ricarte Soto',
  'Incumplimiento de garantías FOFAR',
] as const
export type Topic = (typeof topics)[number]

export type OirsCase = {
  id?: string
  folio: string
  requestType: RequestType
  intakeChannel: IntakeChannel
  topic: Topic
  sectorId: string
  gender: 'femenino' | 'masculino' | 'trans masculino' | 'trans femenino' | 'no binario'
  migratoryStatus: 'chileno' | 'migrante'
  receivedAt: string // ISO
  dueAt: string // ISO
  respondedAt?: string | null
  response: {
    type?: 'correo' | 'carta' | 'plataforma' | 'otro' | null
    summary?: string | null
    caseText?: string | null
    responseText?: string | null
    files?: FileMeta[]
  }
  allegedStaffIds?: string[]
  allegedStaff?: {
    name: string
    role?: string
    sectorIds?: string[]
    sectorId?: string
  }[]
  sentToStaffAt?: string | null
  sentToDireccionAt?: string | null
  sentToDirectorAt?: string | null
  staffReplyAt?: string | null
  staffReplyText?: string | null
  direccionReplyAt?: string | null
  patientName?: string
  patientRut?: string
  patientEmail?: string
  patientAddress?: string
  // Archivos estandarizados por bloque
  caseOriginalFile?: FileMeta | null
  staffReplyFile?: FileMeta | null
  responseMainFile?: FileMeta | null
  googleDriveFolder?: string
  status: CaseStatus
  sla: SlaStatus
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type Sector = {
  id?: string
  name: string
  code: string
  active: boolean
  chiefId?: string | null
}
export type Staff = {
  id?: string
  email: string
  name: string
  role: string
  sectorIds?: string[]
  isChief: boolean
  chiefId?: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

// Schemas de validación con Zod
export const fileMetaSchema = z.object({
  name: z.string(),
  path: z.string(),
  mime: z.string(),
  size: z.number(),
  url: z.string().url().optional(),
})

export const oirsCaseSchema = z.object({
  folio: z.string().min(1, 'El folio es obligatorio'),
  requestType: z.enum(requestTypes),
  intakeChannel: z.enum(intakeChannels),
  topic: z.enum(topics),
  sectorId: z.string(),
  gender: z.enum(['femenino', 'masculino', 'trans masculino', 'trans femenino', 'no binario']),
  migratoryStatus: z.enum(['chileno', 'migrante']),
  receivedAt: z.string(),
  dueAt: z.string(),
  respondedAt: z.string().nullable().optional(),
  response: z
    .object({
      type: z.enum(['correo', 'carta', 'plataforma', 'otro']).nullable().optional(),
      summary: z.string().nullable().optional(),
      caseText: z.string().nullable().optional(),
      responseText: z.string().nullable().optional(),
      files: z.array(fileMetaSchema).optional(),
    })
    .default({}),
  allegedStaffIds: z.array(z.string()).optional(),
  allegedStaff: z
    .array(
      z.object({
        name: z.string(),
        role: z.string().optional(),
        sectorIds: z.array(z.string()).optional(),
        sectorId: z.string().optional(),
      })
    )
    .optional(),
  sentToStaffAt: z.string().nullable().optional(),
  sentToDireccionAt: z.string().nullable().optional(),
  sentToDirectorAt: z.string().nullable().optional(),
  staffReplyAt: z.string().nullable().optional(),
  staffReplyText: z.string().nullable().optional(),
  direccionReplyAt: z.string().nullable().optional(),
  patientName: z.string().optional(),
  patientRut: z.string().optional(),
  patientEmail: z.string().optional(),
  patientAddress: z.string().optional(),
  caseOriginalFile: fileMetaSchema.nullable().optional(),
  staffReplyFile: fileMetaSchema.nullable().optional(),
  responseMainFile: fileMetaSchema.nullable().optional(),
  status: z.enum(caseStatuses),
  sla: z.enum(slaStatuses),
  notes: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const caseEventSchema = z.object({
  type: z.enum([
    'status_change',
    'note',
    'file_upload',
    'send_to_staff',
    'send_to_direccion',
    'receive_direccion_reply',
  ]),
  by: z.string(),
  at: z.string(),
  payload: z.record(z.string(), z.unknown()).optional(),
})
