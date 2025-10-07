import type { OirsCase, SlaStatus } from '../types/oirs'

export function calcSla(c: Pick<OirsCase, 'dueAt' | 'respondedAt'>, nowISO?: string): SlaStatus {
  const now = nowISO ? new Date(nowISO) : new Date()
  const due = new Date(c.dueAt)
  if (c.respondedAt) {
    return new Date(c.respondedAt) <= due ? 'dentro de plazo' : 'fuera de plazo'
  }
  return now <= due ? 'pendiente dentro de plazo' : 'pendiente fuera de plazo'
}
