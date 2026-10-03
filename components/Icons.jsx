/**
 * مجموعة أيقونات موحّدة (SVG مضمّن، بلا مكتبات خارجية وبلا خدمة أيقونات).
 * كل الأيقونات تستخدم currentColor فتتبع لون النص/اللون المميز تلقائيًا.
 */
const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

export const IconSearch = (p) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.6-3.6" />
  </svg>
);

export const IconHeart = ({ filled = false, ...p }) => (
  <svg {...base} fill={filled ? 'currentColor' : 'none'} {...p}>
    <path d="M12 20s-7-4.4-7-9.3A4.2 4.2 0 0 1 12 7.8 4.2 4.2 0 0 1 19 10.7C19 15.6 12 20 12 20z" />
  </svg>
);

export const IconHome = (p) => (
  <svg {...base} {...p}>
    <path d="M4 11l8-6.5 8 6.5" />
    <path d="M6 10.5V20h12v-9.5" />
  </svg>
);

export const IconFilm = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <path d="M8 4v16M16 4v16M3 12h18" />
  </svg>
);

export const IconTv = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="6" width="18" height="13" rx="2.5" />
    <path d="M9 3l3 3 3-3" />
  </svg>
);

export const IconGrid = (p) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
  </svg>
);

export const IconMore = (p) => (
  <svg {...base} {...p}>
    <circle cx="5" cy="12" r="1.4" />
    <circle cx="12" cy="12" r="1.4" />
    <circle cx="19" cy="12" r="1.4" />
  </svg>
);

export const IconShare = (p) => (
  <svg {...base} {...p}>
    <circle cx="18" cy="5.5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="18.5" r="2.5" />
    <path d="M8.2 10.8l7.6-4M8.2 13.2l7.6 4" />
  </svg>
);

export const IconLink = (p) => (
  <svg {...base} {...p}>
    <path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 1 0-5-5l-1 1" />
    <path d="M13.5 10.5a3.5 3.5 0 0 0-5 0L6 13a3.5 3.5 0 1 0 5 5l1-1" />
  </svg>
);

export const IconPlay = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M10.2 8.6l5 3.4-5 3.4z" fill="currentColor" stroke="none" />
  </svg>
);

export const IconStar = (p) => (
  <svg {...base} {...p}>
    <path d="M12 4.5l2.3 4.9 5.2.7-3.8 3.6 1 5.2-4.7-2.6-4.7 2.6 1-5.2L4.5 10.1l5.2-.7z" />
  </svg>
);

export const IconPen = (p) => (
  <svg {...base} {...p}>
    <path d="M4 20h4l10-10-4-4L4 16z" />
    <path d="M14 6l4 4" />
  </svg>
);

export const IconList = (p) => (
  <svg {...base} {...p}>
    <path d="M8 6h12M8 12h12M8 18h12" />
    <circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const IconUsers = (p) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    <path d="M16.5 6.2a3 3 0 0 1 0 5.6M17 14.6c2.2.5 3.5 2.2 3.5 4.9" />
  </svg>
);

export const IconAlert = (p) => (
  <svg {...base} {...p}>
    <path d="M12 4.5l8.5 15h-17z" />
    <path d="M12 10v4M12 17h.01" />
  </svg>
);

export const IconInfo = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);

export const IconClose = (p) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconArrow = (p) => (
  <svg {...base} {...p}>
    <path d="M14 6l6 6-6 6" />
    <path d="M20 12H4" />
  </svg>
);

export const IconExternal = (p) => (
  <svg {...base} {...p}>
    <path d="M14 4h6v6" />
    <path d="M20 4l-8.5 8.5" />
    <path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
  </svg>
);

export const IconShield = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3.5l7 3v5.5c0 4.3-3 7.6-7 8.5-4-.9-7-4.2-7-8.5V6.5z" />
    <path d="M9.2 12.2l2 2 3.6-3.8" />
  </svg>
);

export const IconScale = (p) => (
  <svg {...base} {...p}>
    <path d="M12 4v16M7 20h10M6 8h12" />
    <path d="M6 8l-2.5 5h5zM18 8l-2.5 5h5z" />
  </svg>
);
