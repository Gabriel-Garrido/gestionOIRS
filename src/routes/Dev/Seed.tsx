import { useState } from 'react'
import { addEvent, createCase, upsertSector, upsertStaff } from '../../services/oirsRepo'
import type { OirsCase } from '../../types/oirs'
import { calculateDueDate } from '../../utils/date'
import { useAuth } from '../../hooks/useAuth'

export default function SeedPage() {
  const [log, setLog] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const { user } = useAuth()
  const isDev = import.meta.env.DEV

  async function run() {
    setRunning(true)
    const push = (m: string) => setLog((l) => [...l, m])
    try {
      push('Creando sectores…')
      const sectors = [
        { name: 'San Borja', code: 'san_borja', active: true },
        { name: 'Parque Forestal', code: 'parque_forestal', active: true },
        { name: 'Dávila Larraín', code: 'davila_larrain', active: true },
      ]
      const sectorIds: string[] = []
      for (const s of sectors) {
        const id = await upsertSector({ id: '', ...s })
        sectorIds.push(id)
      }

      push('Creando funcionarios…')
      const staffIds: string[] = []

      const chiefsSeed = [
        {
          name: 'Ana Pérez',
          email: 'ana@demo.cl',
          role: 'Jefa Enfermería',
          sectorId: sectorIds[0],
        },
        {
          name: 'Luis Soto',
          email: 'luis@demo.cl',
          role: 'Jefe Médico',
          sectorId: sectorIds[1],
        },
        {
          name: 'Carla Díaz',
          email: 'carla@demo.cl',
          role: 'Jefa TENS',
          sectorId: sectorIds[2],
        },
      ] as const

      const chiefIdBySector: Record<string, string> = {}
      for (const chief of chiefsSeed) {
        const id = await upsertStaff({
          name: chief.name,
          email: chief.email,
          role: chief.role,
          sectorIds: [chief.sectorId],
          active: true,
          isChief: true,
          chiefId: null,
        })
        staffIds.push(id)
        chiefIdBySector[chief.sectorId] = id
      }

      const teamSeed = [
        {
          name: 'Diego Herrera',
          email: 'diego@demo.cl',
          role: 'Enfermero',
          sectorId: sectorIds[0],
        },
        {
          name: 'Bárbara Silva',
          email: 'barbara@demo.cl',
          role: 'Médica',
          sectorId: sectorIds[1],
        },
        {
          name: 'Javier Campos',
          email: 'javier@demo.cl',
          role: 'TENS',
          sectorId: sectorIds[2],
        },
      ]

      for (const member of teamSeed) {
        const id = await upsertStaff({
          name: member.name,
          email: member.email,
          role: member.role,
          sectorIds: [member.sectorId],
          active: true,
          isChief: false,
          chiefId: chiefIdBySector[member.sectorId] ?? null,
        })
        staffIds.push(id)
      }

      await Promise.all(
        sectorIds.map((sectorId, idx) =>
          upsertSector({
            id: sectorId,
            name: sectors[idx]?.name ?? `Sector ${idx + 1}`,
            code: sectors[idx]?.code ?? `sector_${idx + 1}`,
            active: sectors[idx]?.active ?? true,
            chiefId: chiefIdBySector[sectorId] ?? null,
          })
        )
      )

      push('Creando casos demo…')
      const now = new Date()
      const received = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7) // hace 7 días
      type Sample = Pick<
        OirsCase,
        'requestType' | 'intakeChannel' | 'sectorId' | 'gender' | 'migratoryStatus'
      >
      const samples: Sample[] = [
        {
          requestType: 'reclamo',
          intakeChannel: 'plataforma',
          sectorId: sectorIds[0],
          gender: 'femenino',
          migratoryStatus: 'chileno',
        },
        {
          requestType: 'solicitud',
          intakeChannel: 'formulario',
          sectorId: sectorIds[1],
          gender: 'masculino',
          migratoryStatus: 'migrante',
        },
        {
          requestType: 'felicitacion',
          intakeChannel: 'correo',
          sectorId: sectorIds[2],
          gender: 'no binario',
          migratoryStatus: 'chileno',
        },
        {
          requestType: 'sugerencia',
          intakeChannel: 'otro',
          sectorId: sectorIds[0],
          gender: 'trans masculino',
          migratoryStatus: 'chileno',
        },
        {
          requestType: 'consulta',
          intakeChannel: 'superintendencia',
          sectorId: sectorIds[1],
          gender: 'trans femenino',
          migratoryStatus: 'migrante',
        },
      ]

      for (let i = 0; i < samples.length; i++) {
        const s = samples[i]
        const due = calculateDueDate(received, s.requestType).toISOString()
        const base: Omit<OirsCase, 'id' | 'sla' | 'createdAt' | 'updatedAt' | 'createdBy'> & {
          createdBy: string
        } = {
          folio: `DEMO-${(i + 1).toString().padStart(3, '0')}`,
          topic: 'Información y trámites institucionales',
          receivedAt: received.toISOString(),
          dueAt: due,
          respondedAt: null,
          response: { type: 'plataforma', summary: `Caso demo ${i + 1}` },
          allegedStaffIds: [staffIds[i % staffIds.length]],
          status: 'en revision',
          notes: 'Caso de demostración',
          createdBy: user?.uid ?? 'seed',
          ...s,
        }

        // Variar estados según el índice para mostrar el flujo actualizado
        let payload = { ...base } as typeof base & {
          sentToStaffAt?: string | null
          staffReplyAt?: string | null
          staffReplyText?: string | null
        }
        if (i === 1) {
          payload.status = 'enviado a funcionario'
          payload.sentToStaffAt = new Date(
            received.getTime() + 1 * 24 * 60 * 60 * 1000
          ).toISOString()
        } else if (i === 2) {
          payload.status = 'descargos recibidos'
          payload.sentToStaffAt = new Date(
            received.getTime() + 1 * 24 * 60 * 60 * 1000
          ).toISOString()
          payload.staffReplyAt = new Date(
            received.getTime() + 3 * 24 * 60 * 60 * 1000
          ).toISOString()
          payload.staffReplyText = 'Descargos de ejemplo'
        } else if (i === 3) {
          payload.status = 'respuesta enviada'
          payload.respondedAt = new Date(received.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString()
          payload.response = {
            ...payload.response,
            type: 'plataforma',
            summary: 'Respuesta enviada (demo)',
          }
        } else if (i === 4) {
          payload.status = 'archivado'
          payload.respondedAt = new Date(received.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()
          payload.response = {
            ...payload.response,
            type: 'plataforma',
            summary: 'Caso archivado (demo)',
          }
        }

        const id = await createCase(payload)
        await addEvent(id, {
          type: 'note',
          by: user?.uid ?? 'seed',
          at: new Date().toISOString(),
          payload: { msg: 'Caso de demostración creado' },
        })
        // Registrar el estado inicial si no es "en revision"
        if (payload.status !== 'en revision') {
          await addEvent(id, {
            type: 'status_change',
            by: user?.uid ?? 'seed',
            at: new Date().toISOString(),
            payload: { from: 'en revision', to: payload.status },
          })
        }
      }

      push('Seeds completadas ✅')
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e && 'message' in e
          ? String((e as { message?: unknown }).message)
          : String(e)
      push('Error: ' + msg)
    } finally {
      setRunning(false)
    }
  }

  if (!isDev) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <h1 className="text-xl font-semibold">Seeds deshabilitadas</h1>
        <p className="text-sm text-gray-600">
          Esta utilidad solo está disponible en entorno de desarrollo.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <h1 className="text-xl font-semibold">Seeds de demostración</h1>
      <p className="text-sm text-gray-600">Crea 3 sectores, 3 funcionarios y 5 casos demo.</p>
      <button
        disabled={running}
        onClick={run}
        className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {running ? 'Ejecutando…' : 'Ejecutar seeds'}
      </button>
      <pre className="max-h-80 overflow-auto rounded border bg-gray-50 p-3 text-xs">
        {log.join('\n')}
      </pre>
    </div>
  )
}
