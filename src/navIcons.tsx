type Props = { id: string };

export function NavIcon({ id }: Props) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (id) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M6 10.5V20h12v-9.5" />
        </svg>
      );
    case 'crew':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M3 19c1.5-3 4-4.5 6-4.5s4.5 1.5 6 4.5" />
          <path d="M14 19c.7-1.8 2.2-3 4-3 1.2 0 2.2.4 3 1.2" />
        </svg>
      );
    case 'aircraft':
      return (
        <svg {...common}>
          <path d="M12 3v18" />
          <path d="M5 10h14" />
          <path d="M7 16h10" />
          <path d="M10 6 12 3l2 3" />
        </svg>
      );
    case 'flights':
      return (
        <svg {...common}>
          <path d="M4 14h9l7-4" />
          <path d="M10 14 8 20" />
          <path d="M13 14l2 5" />
          <path d="M4 14 2 17" />
        </svg>
      );
    case 'operations':
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M8 9h8M8 13h5" />
        </svg>
      );
    case 'maintenance':
      return (
        <svg {...common}>
          <path d="M14.5 5.5a4 4 0 0 0-5.7 5.7L4 16v4h4l4.8-4.8a4 4 0 0 0 1.7-10.7Z" />
        </svg>
      );
    case 'sms':
      return (
        <svg {...common}>
          <path d="M12 4 4 8v8l8 4 8-4V8l-8-4Z" />
          <path d="M12 12v4" />
        </svg>
      );
    case 'communication':
      return (
        <svg {...common}>
          <path d="M5 6h14v9H9l-4 3V6Z" />
        </svg>
      );
    case 'library':
      return (
        <svg {...common}>
          <path d="M5 5h5v14H5zM14 5h5v14h-5z" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
  }
}
