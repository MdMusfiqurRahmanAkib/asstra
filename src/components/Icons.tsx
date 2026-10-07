import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export const IconStatus = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="10" cy="10" r="6.5" />
    <circle cx="10" cy="10" r="1.6" fill="currentColor" stroke="none" />
    <path d="M10 3.5v-2M16.5 10h2" />
  </svg>
)

export const IconCheckin = (p: P) => (
  <svg {...base} {...p}>
    <rect x="4" y="3" width="12" height="15" rx="2" />
    <path d="M7.5 3V2h5v1M7 9l2 2 4-4M7 14h6" />
  </svg>
)

export const IconAct = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 5.5h2M3 10h2M3 14.5h2M8 5.5h9M8 10h9M8 14.5h6" />
  </svg>
)

export const IconEvidence = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 2c0 4 8 4 8 8s-8 4-8 8M14 2c0 4-8 4-8 8s8 4 8 8" />
    <path d="M7.5 5h5M7.5 15h5" />
  </svg>
)

export const IconMethod = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 4.5c2.5-1 5-1 7 .5 2-1.5 4.5-1.5 7-.5v11c-2.5-1-5-1-7 .5-2-1.5-4.5-1.5-7-.5z" />
    <path d="M10 5v11" />
  </svg>
)

export const IconSettings = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 6h8M15 6h2M3 14h2M9 14h8" />
    <circle cx="13" cy="6" r="2" />
    <circle cx="7" cy="14" r="2" />
  </svg>
)

export const IconSun = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="10" cy="10" r="3.5" />
    <path d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.3 4.3l1 1M14.7 14.7l1 1M4.3 15.7l1-1M14.7 5.3l1-1" />
  </svg>
)

export const IconMoon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M16 12.5A6.5 6.5 0 0 1 7.5 4a6.5 6.5 0 1 0 8.5 8.5z" />
  </svg>
)

export const IconTimer = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="10" cy="11" r="6.5" />
    <path d="M10 11V7.5M8 2h4" />
  </svg>
)

export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="logo-limb" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="var(--limb-1)" />
          <stop offset="0.45" stopColor="var(--limb-2)" />
          <stop offset="0.75" stopColor="var(--limb-3)" />
          <stop offset="1" stopColor="var(--limb-4)" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="11" fill="none" stroke="url(#logo-limb)" strokeWidth="3.2" />
      <path d="M16 16 L25.5 6.5" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="1 3" />
      <circle cx="16" cy="16" r="2.6" fill="var(--ink)" />
      <circle cx="27" cy="5" r="2.6" fill="var(--ink)" />
    </svg>
  )
}
