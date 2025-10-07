import Icon from './Icon'
import { caseStatusLabel } from '../../utils/labels'
import type { CaseStatus } from '../../types/oirs'

type Size = 'sm' | 'md'

export default function StatusBadge({
  status,
  size = 'sm',
  withIcon = true,
  className = '',
}: {
  status: CaseStatus
  size?: Size
  withIcon?: boolean
  className?: string
}) {
  const meta = statusMeta(status)
  const sizeCls = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-0.5'
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full font-medium',
        sizeCls,
        meta.badge,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      title={caseStatusLabel[status]}
    >
      {withIcon && meta.icon && (
        <span className="inline-flex">
          <Icon name={meta.icon} className={iconSize} />
        </span>
      )}
      <span>{caseStatusLabel[status] ?? status}</span>
    </span>
  )
}

function statusMeta(status: CaseStatus): {
  icon: Parameters<typeof Icon>[0]['name']
  badge: string
} {
  switch (status) {
    case 'en revision':
      return { icon: 'document', badge: 'bg-gray-100 text-gray-800' }
    case 'enviado a funcionario':
      return { icon: 'send', badge: 'bg-blue-100 text-blue-800' }
    case 'descargos recibidos':
      return { icon: 'chat-bubble', badge: 'bg-purple-100 text-purple-800' }
    case 'enviado a direccion':
      return { icon: 'send', badge: 'bg-blue-100 text-blue-800' }
    case 'respuesta direccion recibida':
      return { icon: 'chat-bubble', badge: 'bg-purple-100 text-purple-800' }
    case 'respuesta enviada':
      return { icon: 'check-circle', badge: 'bg-green-100 text-green-800' }
    case 'archivado':
      return { icon: 'archive-box', badge: 'bg-green-100 text-green-800' }
    default:
      return { icon: 'document', badge: 'bg-gray-100 text-gray-800' }
  }
}
