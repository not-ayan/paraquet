/**
 * Minimal stroke-icon set used across the admin console instead of emoji.
 * Hand-written (no icon package dependency) — each is a 20x20 viewBox,
 * currentColor stroke, matched line weight for a consistent look.
 */

const base = {
  width: '1em',
  height: '1em',
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function IconAlertTriangle(props) {
  return (
    <svg {...base} {...props}>
      <path d="M8.68 3.36 1.9 15.2a1.5 1.5 0 0 0 1.3 2.25h13.6a1.5 1.5 0 0 0 1.3-2.25L11.32 3.36a1.5 1.5 0 0 0-2.64 0Z" />
      <path d="M10 7.75v3.75" />
      <path d="M10 14.25h.008" />
    </svg>
  );
}

export function IconCheckCircle(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M7 10.2 9 12.2l4-4.4" />
    </svg>
  );
}

export function IconXCircle(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M7.5 7.5l5 5M12.5 7.5l-5 5" />
    </svg>
  );
}

export function IconPackage(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 6.25 10 2.5l7.5 3.75-7.5 3.75-7.5-3.75Z" />
      <path d="M2.5 6.25v7.5L10 17.5l7.5-3.75v-7.5" />
      <path d="M10 10v7.5" />
    </svg>
  );
}

export function IconCalendar(props) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="4" width="15" height="13.5" rx="1.5" />
      <path d="M2.5 8h15M6.5 2v3.5M13.5 2v3.5" />
    </svg>
  );
}

export function IconFolder(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 5.5A1.5 1.5 0 0 1 4 4h3.5l1.5 2H16a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 16 16H4a1.5 1.5 0 0 1-1.5-1.5v-9Z" />
    </svg>
  );
}

export function IconUsers(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="7" cy="6.5" r="2.5" />
      <path d="M2.5 17v-1.2A3.8 3.8 0 0 1 6.3 12h1.4a3.8 3.8 0 0 1 3.8 3.8V17" />
      <circle cx="14" cy="7.5" r="2.2" />
      <path d="M13 12.1a3.4 3.4 0 0 1 4.5 3.2V17" />
    </svg>
  );
}

export function IconUser(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="10" cy="6.5" r="3" />
      <path d="M3.5 17v-1.3A4.7 4.7 0 0 1 8.2 11h3.6a4.7 4.7 0 0 1 4.7 4.7V17" />
    </svg>
  );
}

export function IconFileText(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 2.5h6.5L15 6v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" />
      <path d="M11 2.5V6h4" />
      <path d="M6.5 10h6M6.5 12.5h6M6.5 15h4" />
    </svg>
  );
}

export function IconShieldCheck(props) {
  return (
    <svg {...base} {...props}>
      <path d="M10 2.5 16 5v5c0 4.2-2.6 6.9-6 7.5-3.4-.6-6-3.3-6-7.5V5l6-2.5Z" />
      <path d="M7.3 10 9.3 12l3.4-3.7" />
    </svg>
  );
}

export function IconArrowUpRight(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5.5 14.5 14.5 5.5M7 5.5h7.5V13" />
    </svg>
  );
}

export function IconArrowRight(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 10h13M11.5 5.5 16 10l-4.5 4.5" />
    </svg>
  );
}

export function IconRefresh(props) {
  return (
    <svg {...base} {...props}>
      <path d="M17 10a7 7 0 0 1-12.1 4.8L3 13" />
      <path d="M3 10a7 7 0 0 1 12.1-4.8L17 7" />
      <path d="M3 13v-3h3M17 7v3h-3" />
    </svg>
  );
}

export function IconUpload(props) {
  return (
    <svg {...base} {...props}>
      <path d="M10 13V3.5M6.5 7 10 3.5 13.5 7" />
      <path d="M3.5 14v1.5A1.5 1.5 0 0 0 5 17h10a1.5 1.5 0 0 0 1.5-1.5V14" />
    </svg>
  );
}

export function IconDownload(props) {
  return (
    <svg {...base} {...props}>
      <path d="M10 3v9.5M6.5 9 10 12.5 13.5 9" />
      <path d="M3.5 14v1.5A1.5 1.5 0 0 0 5 17h10a1.5 1.5 0 0 0 1.5-1.5V14" />
    </svg>
  );
}

export function IconMapPin(props) {
  return (
    <svg {...base} {...props}>
      <path d="M10 17.5s6-5.15 6-9.5A6 6 0 0 0 4 8c0 4.35 6 9.5 6 9.5Z" />
      <circle cx="10" cy="8" r="2" />
    </svg>
  );
}

export function IconCamera(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 6.5A1.5 1.5 0 0 1 4 5h1.5l1-1.5h7l1 1.5H16a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 16 15H4a1.5 1.5 0 0 1-1.5-1.5v-8Z" />
      <circle cx="10" cy="10" r="3" />
    </svg>
  );
}

export function IconCpu(props) {
  return (
    <svg {...base} {...props}>
      <rect x="6" y="6" width="8" height="8" rx="1" />
      <rect x="2.5" y="8.5" width="2" height="3" />
      <rect x="15.5" y="8.5" width="2" height="3" />
      <rect x="8.5" y="2.5" width="3" height="2" />
      <rect x="8.5" y="15.5" width="3" height="2" />
    </svg>
  );
}

export function IconInfo(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 9v4.5M10 6.5h.008" />
    </svg>
  );
}

export function IconInbox(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 11h3.2l1.3 2.6a1.5 1.5 0 0 0 1.34.9h2.32a1.5 1.5 0 0 0 1.34-.9L13.8 11H17" />
      <path d="M3 11 4.6 4.9A1.5 1.5 0 0 1 6 3.8h8a1.5 1.5 0 0 1 1.44 1.1L17 11" />
      <path d="M3 11v3.5A1.5 1.5 0 0 0 4.5 16h11a1.5 1.5 0 0 0 1.5-1.5V11" />
    </svg>
  );
}

export function IconChevronRight(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7.5 4.5 13 10l-5.5 5.5" />
    </svg>
  );
}
