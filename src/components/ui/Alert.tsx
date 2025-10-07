type Variant = 'info' | 'success' | 'warning' | 'danger'

export default function Alert({
  variant = 'info',
  title,
  children,
}: {
  variant?: Variant
  title?: string
  children?: React.ReactNode
}) {
  const cls =
    variant === 'success'
      ? 'bg-green-50 text-green-800 border-green-200'
      : variant === 'warning'
        ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
        : variant === 'danger'
          ? 'bg-red-50 text-red-800 border-red-200'
          : 'bg-sky-50 text-sky-800 border-sky-200'
  return (
    <div role="alert" className={['rounded-md border px-3 py-2 text-sm', cls].join(' ')}>
      {title && <div className="font-medium">{title}</div>}
      {children && <div>{children}</div>}
    </div>
  )
}
