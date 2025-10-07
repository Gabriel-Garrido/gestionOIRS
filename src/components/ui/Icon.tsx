type Name =
  | 'send'
  | 'inbox-arrow-down'
  | 'chat-bubble'
  | 'check-circle'
  | 'archive-box'
  | 'x-circle'
  | 'users'
  | 'building'
  | 'document'
  | 'chart'
  | 'eye'
  | 'download'
  | 'rotate'
  | 'menu'
  | 'arrow-left'
  | 'info'
  | 'edit'

export default function Icon({ name, className = 'h-4 w-4' }: { name: Name; className?: string }) {
  const stroke = 'currentColor'
  const props = { className, fill: 'none', stroke, strokeWidth: 1.5, viewBox: '0 0 24 24' }
  switch (name) {
    case 'send':
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 12L3 3l9 3m-6 6l15 9-6-18-9 9z"
          />
        </svg>
      )
    case 'inbox-arrow-down':
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 8l7.89-5.26a2 2 0 012.22 0L21 8v8a2 2 0 01-2 2h-3m-6 0H5a2 2 0 01-2-2V8"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v6m0 0l-3-3m3 3l3-3" />
        </svg>
      )
    case 'chat-bubble':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a9 9 0 11-4.219-7.688L21 4v8z"
          />
        </svg>
      )
    case 'check-circle':
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )
    case 'archive-box':
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 7h18M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7M9 11h6"
          />
        </svg>
      )
    case 'x-circle':
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )
    case 'users':
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2"
          />
          <circle cx="9" cy="7" r="3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M23 20v-2a4 4 0 00-3-3.87" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      )
    case 'building':
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 21h18M9 8h6M8 21V4a1 1 0 011-1h6a1 1 0 011 1v17"
          />
        </svg>
      )
    case 'document':
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 3h8l4 4v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
        </svg>
      )
    case 'chart':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17V7" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 17V12" />
        </svg>
      )
    case 'eye':
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"
          />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    case 'download':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 19h14a2 2 0 002-2v0a2 2 0 00-2-2H5a2 2 0 00-2 2v0a2 2 0 002 2z"
          />
        </svg>
      )
    case 'rotate':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 20v-6h-6" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 10a8 8 0 0114.142-4.142L20 7" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 14a8 8 0 01-14.142 4.142L4 17"
          />
        </svg>
      )
    case 'menu':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 18h18" />
        </svg>
      )
    case 'arrow-left':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      )
    case 'info':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8h.01" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 12h1v4h1" />
        </svg>
      )
    case 'edit':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      )
    default:
      return null
  }
}
