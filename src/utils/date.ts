const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>()

function getUtcFormatter(locale = 'es-CL') {
  if (!dateFormatterCache.has(locale)) {
    dateFormatterCache.set(locale, new Intl.DateTimeFormat(locale, { timeZone: 'UTC' }))
  }
  return dateFormatterCache.get(locale) as Intl.DateTimeFormat
}

export function formatDateUtcYmd(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatDateLocalYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDateOnly(value: string): Date | null {
  if (!DATE_ONLY_REGEX.test(value)) return null
  const y = Number(value.slice(0, 4))
  const m = Number(value.slice(5, 7)) - 1
  const d = Number(value.slice(8, 10))
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null
  return new Date(Date.UTC(y, m, d))
}

function parseDateForDisplay(value: string): Date | null {
  const trimmed = value.trim()
  if (DATE_ONLY_REGEX.test(trimmed)) {
    return parseDateOnly(trimmed)
  }
  const parsed = new Date(trimmed)
  if (isNaN(parsed.getTime())) return null
  return parsed
}

export function normalizeDateInput(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (DATE_ONLY_REGEX.test(trimmed)) return trimmed
  const parsed = new Date(trimmed)
  if (isNaN(parsed.getTime())) return null
  return formatDateUtcYmd(parsed)
}

export function toDateInputValue(value: string | null | undefined): string {
  const normalized = normalizeDateInput(value)
  return normalized ?? ''
}

export function dateLowerBound(value: string | null | undefined): string | null {
  return normalizeDateInput(value)
}

export function dateUpperBound(value: string | null | undefined): string | null {
  const normalized = normalizeDateInput(value)
  return normalized ? `${normalized}` : null
}

export function iso(d: Date | string | null | undefined): string | null {
  if (!d) return null
  if (typeof d === 'string') {
    if (DATE_ONLY_REGEX.test(d.trim())) {
      const parsed = parseDateOnly(d.trim())
      return parsed ? parsed.toISOString() : null
    }
    const fromString = new Date(d)
    return isNaN(fromString.getTime()) ? null : fromString.toISOString()
  }
  return isNaN(d.getTime()) ? null : d.toISOString()
}

export function fmt(d: string | null | undefined, locale = 'es-CL') {
  if (!d) return '-'
  const parsed = parseDateForDisplay(d)
  if (!parsed) return '-'
  return parsed.toLocaleString(locale)
}

// Solo fecha (sin hora)
export function fmtDate(d: string | null | undefined, locale = 'es-CL') {
  if (!d) return '-'
  const parsed = parseDateForDisplay(d)
  if (!parsed) return '-'
  return getUtcFormatter(locale).format(parsed)
}

// --- Business days helper (WORKDAY.INTL-like) ---
// weekendMask: 7 chars Mon..Sun, '1' = no laborable; por defecto '0000011' (S y D)
// Usa UTC para evitar desfases de zona horaria en comparaciones de día de semana.
export function isWeekendIntl(date: Date, weekendMask = '0000011') {
  const day = (date.getUTCDay() + 6) % 7 // Mon=0..Sun=6, basado en UTC
  return weekendMask[day] === '1'
}

export function addBusinessDaysIntl(
  startISO: string,
  businessDays: number,
  weekendMask = '0000011',
  holidays?: Set<string>
): string {
  // Normaliza a medianoche UTC para evitar desfases por zona horaria
  const y = Number(startISO.slice(0, 4))
  const m = Number(startISO.slice(5, 7)) - 1
  const day = Number(startISO.slice(8, 10))
  const d = new Date(Date.UTC(y, m, day))
  let added = 0
  while (added < businessDays) {
    // Usar operaciones UTC para no mezclar hora local y UTC
    d.setUTCDate(d.getUTCDate() + 1)
    const ymd = d.toISOString().slice(0, 10)
    if (isWeekendIntl(d, weekendMask)) continue
    if (holidays?.has(ymd)) continue
    added++
  }
  return d.toISOString()
}

// --- Feriados Chile por año ---

// Feriados Chile 2025 (fallback)
export const CL_2025_HOLIDAYS = new Set<string>([
  '2025-01-01',
  '2025-04-18',
  '2025-04-19',
  '2025-05-01',
  '2025-05-21',
  '2025-06-20',
  '2025-06-29',
  '2025-07-16',
  '2025-08-15',
  '2025-09-18',
  '2025-09-19',
  '2025-10-12',
  '2025-10-31',
  '2025-11-01',
  '2025-12-08',
  '2025-12-25',
])

// Feriados Chile 2026 (fallback)
export const CL_2026_HOLIDAYS = new Set<string>([
  '2026-01-01',
  '2026-04-03', // Viernes Santo (Semana Santa 2026: Pascua 5 abril)
  '2026-04-04', // Sábado de Gloria
  '2026-05-01',
  '2026-05-21',
  '2026-06-22', // Día Nacional de los Pueblos Indígenas (lunes próx. al solsticio 21 jun)
  '2026-06-29',
  '2026-07-16',
  '2026-08-15',
  '2026-09-18',
  '2026-09-19',
  '2026-10-12',
  '2026-10-31',
  '2026-11-01',
  '2026-12-08',
  '2026-12-25',
])

/** Devuelve un Set combinando los feriados conocidos para los años indicados. */
export function getKnownHolidays(...years: number[]): Set<string> {
  const result = new Set<string>()
  const byYear: Record<number, Set<string>> = {
    2025: CL_2025_HOLIDAYS,
    2026: CL_2026_HOLIDAYS,
  }
  for (const year of years) {
    const src = byYear[year]
    if (src) for (const d of src) result.add(d)
  }
  return result
}

// --- calculateDueDate (obligatorio) usando operaciones UTC ---
export function calculateDueDate(
  receivedAt: Date,
  requestType: string,
  holidays?: Set<string>
): Date {
  const businessDays = requestType === 'felicitacion' ? 20 : 15
  const d = new Date(
    Date.UTC(receivedAt.getUTCFullYear(), receivedAt.getUTCMonth(), receivedAt.getUTCDate())
  )
  // Si no se proveen feriados, usar los del año de la fecha recibida y el siguiente
  const effectiveHolidays =
    holidays ?? getKnownHolidays(receivedAt.getUTCFullYear(), receivedAt.getUTCFullYear() + 1)
  let added = 0
  while (added < businessDays) {
    d.setUTCDate(d.getUTCDate() + 1)
    const ymd = d.toISOString().slice(0, 10)
    if (isWeekendIntl(d)) continue
    if (effectiveHolidays.has(ymd)) continue
    added++
  }
  return d
}
