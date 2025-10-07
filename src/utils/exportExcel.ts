import * as XLSX from 'xlsx'
import type { OirsCase } from '../types/oirs'

export type CaseExportContext = {
  sectorNameById?: Map<string, string>
  staffNameById?: Map<string, string>
  staticColumns?: Record<string, string>
}

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function formatLocalDateTime(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return DATE_TIME_FORMAT.format(date)
}

function resolveSectorName(caseItem: OirsCase, context: CaseExportContext): string {
  if (context.sectorNameById?.has(caseItem.sectorId)) {
    return context.sectorNameById.get(caseItem.sectorId) ?? ''
  }
  const firstAllegedSector = Array.isArray(caseItem.allegedStaff)
    ? caseItem.allegedStaff.find((staff) => staff?.sectorIds?.length)?.sectorIds?.[0]
    : undefined
  if (firstAllegedSector && context.sectorNameById?.has(firstAllegedSector)) {
    return context.sectorNameById.get(firstAllegedSector) ?? ''
  }
  return caseItem.sectorId ?? ''
}

function resolveStaffNames(caseItem: OirsCase, context: CaseExportContext): string {
  if (Array.isArray(caseItem.allegedStaff) && caseItem.allegedStaff.length > 0) {
    const names = caseItem.allegedStaff.map((staff) => staff?.name).filter(Boolean)
    if (names.length > 0) return names.join(', ')
  }
  if (Array.isArray(caseItem.allegedStaffIds) && caseItem.allegedStaffIds.length > 0) {
    const names = caseItem.allegedStaffIds
      .map((id) => context.staffNameById?.get(id) ?? id)
      .filter(Boolean)
    return names.join(', ')
  }
  return ''
}

function toRow(caseItem: OirsCase, context: CaseExportContext = {}): Record<string, unknown> {
  return {
    ID: caseItem.id ?? '',
    Folio: caseItem.folio,
    'Estado actual': caseItem.status,
    'Estado SLA': caseItem.sla,
    'Tipo de solicitud': caseItem.requestType,
    'Canal de ingreso': caseItem.intakeChannel,
    Tema: caseItem.topic,
    'Sector ID': caseItem.sectorId,
    Sector: resolveSectorName(caseItem, context),
    'Recibido (ISO)': caseItem.receivedAt,
    'Recibido (CL)': formatLocalDateTime(caseItem.receivedAt),
    'Vence (ISO)': caseItem.dueAt,
    'Vence (CL)': formatLocalDateTime(caseItem.dueAt),
    'Respondido (ISO)': caseItem.respondedAt ?? '',
    'Respondido (CL)': formatLocalDateTime(caseItem.respondedAt),
    'Funcionario(s) aludidos': resolveStaffNames(caseItem, context),
    'Enviado a funcionario (ISO)': caseItem.sentToStaffAt ?? '',
    'Enviado a funcionario (CL)': formatLocalDateTime(caseItem.sentToStaffAt),
    'Respuesta funcionario (ISO)': caseItem.staffReplyAt ?? '',
    'Respuesta funcionario (CL)': formatLocalDateTime(caseItem.staffReplyAt),
    'Enviado a dirección (ISO)': caseItem.sentToDireccionAt ?? '',
    'Enviado a dirección (CL)': formatLocalDateTime(caseItem.sentToDireccionAt),
    'Respuesta dirección (ISO)': caseItem.direccionReplyAt ?? '',
    'Respuesta dirección (CL)': formatLocalDateTime(caseItem.direccionReplyAt),
    'Creado por': caseItem.createdBy,
    'Creado (ISO)': caseItem.createdAt,
    'Creado (CL)': formatLocalDateTime(caseItem.createdAt),
    'Actualizado (ISO)': caseItem.updatedAt,
    'Actualizado (CL)': formatLocalDateTime(caseItem.updatedAt),
    ...context.staticColumns,
  }
}

export function casesToExportRows(
  cases: OirsCase[],
  context: CaseExportContext = {}
): Record<string, unknown>[] {
  return cases.map((caseItem) => toRow(caseItem, context))
}

export function exportCasesToExcel(
  cases: OirsCase[],
  {
    filename,
    context,
    sheetName = 'Casos',
  }: {
    filename: string
    context?: CaseExportContext
    sheetName?: string
  }
) {
  const workbook = XLSX.utils.book_new()
  const rows = casesToExportRows(cases, context)

  const worksheet =
    rows.length > 0
      ? XLSX.utils.json_to_sheet(rows)
      : XLSX.utils.json_to_sheet([{ Mensaje: 'Sin datos para el rango seleccionado' }])

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  const normalizedFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`

  XLSX.writeFile(workbook, normalizedFilename, { compression: true })
}
