export default function Loading({
  text = 'Cargando…',
  className = '',
}: {
  text?: string
  className?: string
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 py-8 ${className}`}>
      <span className="relative flex h-8 w-8">
        <span className="animate-spin absolute inline-flex h-full w-full rounded-full bg-gradient-to-tr from-blue-400 via-blue-600 to-blue-400 opacity-30"></span>
        <span className="relative inline-flex h-8 w-8 rounded-full bg-blue-500 opacity-80"></span>
      </span>
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  )
}
