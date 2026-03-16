interface NavIconProps {
  name: string;
  className?: string;
}

export function NavIcon({ name, className = 'h-5 w-5' }: NavIconProps): React.ReactElement {
  const props = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  switch (name) {
    case 'dashboard':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case 'diagnosis':
      return (
        <svg {...props}>
          <path d="M21 12a9 9 0 1 1-9-9" />
          <path d="M21 3v6h-6" />
          <path d="M12 12l4-4" />
        </svg>
      );
    case 'simulation':
      return (
        <svg {...props}>
          <path d="M3 3v18h18" />
          <path d="M7 16l4-8 4 4 5-10" />
        </svg>
      );
    case 'tax':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9 9h4.5a1.5 1.5 0 0 1 0 3H9v-3z" />
          <path d="M9 12h5a1.5 1.5 0 0 1 0 3H9v-3z" />
          <path d="M11 7v2" />
          <path d="M11 15v2" />
        </svg>
      );
    case 'compare':
      return (
        <svg {...props}>
          <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" />
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <path d="M12 3v18" />
        </svg>
      );
    case 'agent':
      return (
        <svg {...props}>
          <path d="M12 3c-1.2 0-2.4.6-3 1.7A3.6 3.6 0 0 0 4.6 9c-1 .6-1.7 1.8-1.5 3.2.1 1.4 1.1 2.5 2.3 3" />
          <path d="M12 3c1.2 0 2.4.6 3 1.7A3.6 3.6 0 0 1 19.4 9c1 .6 1.7 1.8 1.5 3.2-.1 1.4-1.1 2.5-2.3 3" />
          <path d="M12 3v9" />
          <circle cx="12" cy="17" r="4" />
          <path d="M12 15v4" />
          <path d="M10 17h4" />
        </svg>
      );
    case 'learn':
      return (
        <svg {...props}>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );
    case 'alerts':
      return (
        <svg {...props}>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case 'chevron-left':
      return (
        <svg {...props}>
          <path d="M15 18l-6-6 6-6" />
        </svg>
      );
    case 'chevron-right':
      return (
        <svg {...props}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...props}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
    case 'close':
      return (
        <svg {...props}>
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      );
    case 'search':
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      );
    case 'bell':
      return (
        <svg {...props}>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}
