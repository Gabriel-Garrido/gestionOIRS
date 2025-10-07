import React from 'react'

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      {icon && <div className="text-gray-400">{icon}</div>}
      <h3 className="text-h4">{title}</h3>
      {description && <p className="text-gray-600 max-w-prose">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
