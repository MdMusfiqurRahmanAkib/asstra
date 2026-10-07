import { useMemo } from 'react'
import { DOMAINS } from '../lib/indicators'
import type { Reading } from '../lib/baseline'
import { fmt, levelWords } from '../lib/format'

const C = 200
const R = 112
const K = 17 // pixels per spread

interface Props {
  readings: Reading[]
  selected: string | null
  onSelect: (id: string | null) => void
  center: React.ReactNode
}

export function TetherRing({ readings, selected, onSelect, center }: Props) {
  const layout = useMemo(() => {
    const groups = DOMAINS.map((d) => ({ d, items: readings.filter((r) => r.indicator.domain === d.id) }))
    const slots = readings.length + groups.length
    const step = (Math.PI * 2) / slots
    let k = 0.5
    const pts: { r: Reading; a: number }[] = []
    const labels: { name: string; a: number; a0: number; a1: number }[] = []
    for (const g of groups) {
      const a0 = -Math.PI / 2 + k * step
      for (const r of g.items) {
        pts.push({ r, a: -Math.PI / 2 + k * step })
        k += 1
      }
      const a1 = -Math.PI / 2 + (k - 1) * step
      labels.push({ name: g.d.name, a: (a0 + a1) / 2, a0, a1 })
      k += 1
    }
    return { pts, labels }
  }, [readings])

  const radiusFor = (r: Reading) => {
    if (r.concernZ === undefined) return R
    const cz = Math.max(-2.5, Math.min(4.6, r.concernZ))
    return R + cz * K
  }

  const xy = (rad: number, a: number) => [C + rad * Math.cos(a), C + rad * Math.sin(a)] as const

  return (
    <div className="ring-wrap">
      <svg viewBox="0 0 400 400" className="ring" role="group" aria-label="Every indicator against your own baseline">
        <defs>
          <linearGradient id="ring-limb" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="var(--limb-1)" />
            <stop offset="0.42" stopColor="var(--limb-2)" />
            <stop offset="0.74" stopColor="var(--limb-3)" />
            <stop offset="1" stopColor="var(--limb-4)" />
          </linearGradient>
          <radialGradient id="ring-glow">
            <stop offset="0.55" stopColor="var(--limb-2)" stopOpacity="0" />
            <stop offset="0.72" stopColor="var(--limb-2)" stopOpacity="0.07" />
            <stop offset="1" stopColor="var(--limb-2)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={C} cy={C} r={R + 3 * K} fill="url(#ring-glow)" />
        <circle cx={C} cy={C} r={R + 2 * K} className="ring-band watch" />
        <circle cx={C} cy={C} r={R + 3 * K} className="ring-band act" />
        <circle cx={C} cy={C} r={R} fill="none" stroke="url(#ring-limb)" strokeWidth="5" />

        {layout.labels.map((l) => {
          const rr = R - 16
          const [x0, y0] = xy(rr, l.a0 - 0.13)
          const [x1, y1] = xy(rr, l.a1 + 0.13)
          const id = `arc-${l.name.replace(/\W/g, '')}`
          const flip = Math.sin(l.a) > 0.15
          const d = flip
            ? `M ${x1} ${y1} A ${rr} ${rr} 0 0 0 ${x0} ${y0}`
            : `M ${x0} ${y0} A ${rr} ${rr} 0 0 1 ${x1} ${y1}`
          return (
            <g key={l.name} aria-hidden="true">
              <path id={id} d={d} fill="none" />
              <text className="ring-domain" dy={flip ? 8 : 0}>
                <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
                  {l.name.split(' ')[0]}
                </textPath>
              </text>
            </g>
          )
        })}

        {layout.pts.map(({ r, a }, i) => {
          const rad = radiusFor(r)
          const [bx, by] = xy(R, a)
          const [x, y] = xy(rad, a)
          const isSel = selected === r.indicator.id
          const has = r.value !== undefined
          const label = `${r.indicator.label}: ${has ? fmt(r.value!, r.indicator) : 'not logged'}. ${levelWords[r.level]}`
          return (
            <g
              key={r.indicator.id}
              className={`ring-pt ${r.level} ${isSel ? 'sel' : ''}`}
              style={{ ['--dx' as string]: `${bx - x}px`, ['--dy' as string]: `${by - y}px`, ['--i' as string]: i }}
              tabIndex={0}
              role="button"
              aria-pressed={isSel}
              aria-label={label}
              onClick={() => onSelect(isSel ? null : r.indicator.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(isSel ? null : r.indicator.id)
                }
              }}
            >
              <line x1={bx} y1={by} x2={x} y2={y} className="tether" />
              <circle cx={x} cy={y} r={14} className="hit" />
              <circle cx={x} cy={y} r={isSel ? 7.5 : has ? 5.5 : 4} className="pt" />
              <title>{label}</title>
            </g>
          )
        })}
      </svg>
      <div className="ring-center">{center}</div>
    </div>
  )
}
