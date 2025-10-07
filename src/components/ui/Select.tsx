import React from 'react'

export default function Select({
  className = '',
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const base =
    'w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white'
  const cls = [base, className].filter(Boolean).join(' ')
  return <select className={cls} {...props} />
}
