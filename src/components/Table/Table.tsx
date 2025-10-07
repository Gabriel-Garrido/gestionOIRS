export type Column<T> = {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
}

export default function Table<T extends object>({
  columns,
  rows,
}: {
  columns: Column<T>[]
  rows: T[]
}) {
  return (
    <div className="overflow-x-auto rounded border">
      <table className="min-w-full divide-y text-xs sm:text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th
                key={String(c.key)}
                className="sticky top-0 bg-gray-50 px-2 py-2 text-left font-medium text-gray-700 sm:px-3"
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {columns.map((c) => {
                const val = (r as Record<string, unknown>)[c.key as string] as unknown
                return (
                  <td key={String(c.key)} className="px-2 py-2 sm:px-3">
                    {c.render ? c.render(r) : String(val ?? '')}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
