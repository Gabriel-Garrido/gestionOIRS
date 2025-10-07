import React from 'react'

export default function Label({
  children,
  htmlFor,
  className = '',
}: {
  children: React.ReactNode
  htmlFor?: string
  className?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={['block text-sm font-medium', className].filter(Boolean).join(' ')}
    >
      {children}
    </label>
  )
}
