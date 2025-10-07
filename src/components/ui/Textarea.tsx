import React from 'react'

export default function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const cls =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200'
  return <textarea className={cls} {...props} />
}
