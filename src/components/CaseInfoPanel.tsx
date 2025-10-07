import { Link } from 'react-router-dom'
import Card from './ui/Card'
import Icon from './ui/Icon'
import StatusBadge from './ui/StatusBadge'
import { fmtDate } from '../utils/date'
import type { OirsCase } from '../types/oirs'

interface Staff {
  id: string
  name: string
  role?: string | null
  sectorIds?: string[]
  sectorNames?: string[]
}

interface CaseInfoPanelProps {
  item: OirsCase
  sectorName: string
  allegedStaff: Staff[]
}

export default function CaseInfoPanel({ item, sectorName, allegedStaff }: CaseInfoPanelProps) {
  return (
    <Card className="p-6 space-y-6">
      {/* Resumen */}
      <div>
        <div className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Icon name="document" /> Resumen
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          <Field label="Tipo" value={item.requestType} />
          <Field label="Canal" value={item.intakeChannel} />
          <Field
            label="Sector"
            value={
              item.sectorId ? (
                <Link
                  to={`/catalogs/sectors/${item.sectorId}`}
                  className="text-blue-600 hover:underline"
                >
                  {sectorName || item.sectorId}
                </Link>
              ) : (
                <span className="text-gray-500">No asignado</span>
              )
            }
          />
          <Field label="Tema" value={item.topic} />
          <Field label="Recibido" value={fmtDate(item.receivedAt)} />
          <Field label="Vence" value={fmtDate(item.dueAt)} />
          <Field label="Estado" value={<StatusBadge status={item.status} size="md" />} />
          <Field
            label="Carpeta Google Drive"
            value={
              item.googleDriveFolder ? (
                <a
                  href={item.googleDriveFolder}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Abrir carpeta
                </a>
              ) : (
                <span className="text-gray-500">No proporcionado</span>
              )
            }
          />
          <Field
            label="Tipo de respuesta"
            value={item.response?.type || <span className="text-gray-500">No especificado</span>}
          />
        </div>
      </div>
      {/* Funcionarios aludidos */}
      <div>
        <div className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Icon name="users" /> Funcionarios aludidos
        </div>
        {allegedStaff.length === 0 ? (
          <div className="text-gray-500">No hay funcionarios aludidos en este caso.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allegedStaff.map((st) => {
              const sectorLabel = st.sectorNames?.length
                ? st.sectorNames.join(', ')
                : st.sectorIds?.length
                  ? st.sectorIds.join(', ')
                  : ''
              const tooltipParts = [
                st.name,
                st.role ? `Cargo: ${st.role}` : null,
                sectorLabel ? `Sectores: ${sectorLabel}` : null,
              ].filter(Boolean)
              const tooltip = tooltipParts.length > 0 ? tooltipParts.join(' · ') : undefined
              return (
                <Link
                  key={st.id}
                  to={`/catalogs/staff/${st.id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100 transition shadow-sm"
                  title={tooltip}
                >
                  <Icon name="users" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate max-w-[140px]">{st.name}</span>
                    {st.role && <span className="text-[11px] text-blue-500">{st.role}</span>}
                    {sectorLabel && (
                      <span className="text-[10px] text-blue-400">{sectorLabel}</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
      {/* Información del paciente */}
      <div>
        <div className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Icon name="chat-bubble" /> Información del paciente
        </div>
        <div className="flex flex-col gap-3">
          {[
            { label: 'Nombre', value: item.patientName },
            // RUT eliminado
            { label: 'Correo Electrónico', value: item.patientEmail },
            { label: 'Dirección', value: item.patientAddress },
            { label: 'Género', value: item.gender },
            { label: 'Condición migratoria', value: item.migratoryStatus },
          ].map((field) => (
            <div
              key={field.label}
              className="flex items-center gap-2 rounded bg-gray-50 px-3 py-2 border border-gray-200 shadow-sm"
            >
              <span className="text-xs font-semibold text-gray-500 w-32 shrink-0">
                {field.label}
              </span>
              <span className="text-sm text-gray-800 truncate">
                {field.value || 'No proporcionado'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-gray-600">{label}</div>
      <div className="text-sm">{value ?? '-'}</div>
    </div>
  )
}
