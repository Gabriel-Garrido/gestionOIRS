import { useNavigate } from 'react-router-dom'
import Icon from './Icon'

export default function BackButton({
  fallback,
  label = 'Volver',
  className = '',
}: {
  fallback: string
  label?: string
  className?: string
}) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.state && window.history.state.idx > 0) {
          navigate(-1)
        } else {
          navigate(fallback)
        }
      }}
      className={
        'inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline focus:outline-hidden focus-visible:ring-3 focus-visible:ring-blue-500 rounded ' +
        className
      }
    >
      <Icon name="arrow-left" className="h-4 w-4" />
      {label}
    </button>
  )
}
