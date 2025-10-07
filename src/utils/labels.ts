import type { CaseStatus, IntakeChannel, RequestType } from '../types/oirs'

export const requestTypeLabel: Record<RequestType, string> = {
  reclamo: 'Reclamo',
  solicitud: 'Solicitud',
  felicitacion: 'Felicitación',
  sugerencia: 'Sugerencia',
  consulta: 'Consulta',
}

export const intakeChannelLabel: Record<IntakeChannel, string> = {
  plataforma: 'Plataforma',
  formulario: 'Formulario',
  superintendencia: 'Superintendencia',
  correo: 'Correo',
  'alo santiago': 'Aló Santiago',
  'carta presidente': 'Carta Presidente',
  otro: 'Otro',
}

export const caseStatusLabel: Record<CaseStatus, string> = {
  'en revision': 'En revisión',
  'enviado a funcionario': 'Enviado a funcionario',
  'descargos recibidos': 'Descargos recibidos',
  'enviado a direccion': 'Enviado a Dirección',
  'respuesta direccion recibida': 'Respuesta de Dirección recibida',
  'respuesta enviada': 'Respuesta enviada',
  archivado: 'Archivado',
}
