export default function FileUpload({
  multiple = true,
  onChange,
}: {
  multiple?: boolean
  onChange: (files: File[]) => void
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <span className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
        Seleccionar archivos
      </span>
      <span className="text-sm text-gray-600">(tamaño máx. 4MB c/u)</span>
      <input
        type="file"
        multiple={multiple}
        className="sr-only"
        onChange={(e) => onChange(Array.from(e.target.files ?? []))}
      />
    </label>
  )
}
