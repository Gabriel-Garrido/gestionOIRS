import React from 'react'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => {
    const { className = '', ...rest } = props
    const cls = [
      'w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200',
      className,
    ]
      .filter(Boolean)
      .join(' ')
    return <input ref={ref} className={cls} {...rest} />
  }
)

export default Input
