import type { OirsCase, SlaStatus } from '../types/oirs'

// Extrae solo la parte de fecha YYYY-MM-DD de un ISO string.
// La comparación de strings ISO de solo fecha es equivalente a comparación cronológica.
function toDateOnly(iso: string | null | undefined): string | null {
  if (!iso) return null
  const trimmed = iso.trim()
  return trimmed.length >= 10 ? trimmed.slice(0, 10) : null
}

function todayUtcYmd(): string {
  return new Date().toISOString().slice(0, 10)
}

export function calcSla(c: Pick<OirsCase, 'dueAt' | 'respondedAt'>, nowISO?: string): SlaStatus {
  const dueYmd = toDateOnly(c.dueAt)
  // Si dueAt es inválido no podemos determinar el plazo
  if (!dueYmd) return 'pendiente fuera de plazo'

  if (c.respondedAt) {
    const respondedYmd = toDateOnly(c.respondedAt)
    // Si respondedAt es inválido o es posterior al vencimiento: fuera de plazo
    return respondedYmd && respondedYmd <= dueYmd ? 'dentro de plazo' : 'fuera de plazo'
  }

  // Comparar solo las partes de fecha para evitar errores de zona horaria en la medianoche
  const nowYmd = nowISO ? (toDateOnly(nowISO) ?? todayUtcYmd()) : todayUtcYmd()
  return nowYmd <= dueYmd ? 'pendiente dentro de plazo' : 'pendiente fuera de plazo'
}
