import React from 'react'

export default function SidePanel({
  title,
  children,
  width = 'md',
}: {
  title?: React.ReactNode
  children: React.ReactNode
  width?: 'sm' | 'md' | 'lg'
}) {
  const w = width === 'sm' ? 'w-64' : width === 'lg' ? 'w-[28rem]' : 'w-80'
  return (
    <aside
      className={['panel', w].join(' ')}
      aria-label={typeof title === 'string' ? title : undefined}
    >
      {title && <div className="border-b px-4 py-3 font-medium">{title}</div>}
      <div className="panel-body">{children}</div>
    </aside>
  )
}
