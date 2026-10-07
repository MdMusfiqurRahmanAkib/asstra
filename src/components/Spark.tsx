import type { Reading } from '../lib/baseline'
import { daysBetween } from '../lib/store'

interface Props {
  reading: Reading
  days?: number
  width?: number
  height?: number
  endDate: string
}

/** Recent values with your baseline drawn as a band (median plus or minus two spreads). */
export function Spark({ reading, days = 21, width = 176, height = 44, endDate }: Props) {
  const pts = reading.history.filter((h) => daysBetween(h.date, endDate) < days)
  const pad = 5
  const { median: m, spread: s } = reading
  const vals = pts.map((p) => p.value)
  const lo0 = m !== undefined && s !== undefined ? m - 2.2 * s : Infinity
  const hi0 = m !== undefined && s !== undefined ? m + 2.2 * s : -Infinity
  let lo = Math.min(lo0, ...vals)
  let hi = Math.max(hi0, ...vals)
  if (!isFinite(lo) || !isFinite(hi)) return <svg width={width} height={height} aria-hidden="true" />
  if (hi - lo < 1e-9) {
    lo -= 1
    hi += 1
  }
  const x = (date: string) => pad + ((days - 1 - daysBetween(date, endDate)) / (days - 1)) * (width - pad * 2)
  const y = (v: number) => pad + (1 - (v - lo) / (hi - lo)) * (height - pad * 2)
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  const lastIsToday = last && last.date === endDate

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="spark" aria-hidden="true">
      {m !== undefined && s !== undefined && (
        <>
          <rect x={pad} width={width - pad * 2} y={y(m + 2 * s)} height={Math.max(1, y(m - 2 * s) - y(m + 2 * s))} className="spark-band" rx="3" />
          <line x1={pad} x2={width - pad} y1={y(m)} y2={y(m)} className="spark-mid" />
        </>
      )}
      {pts.length > 1 && <path d={path} className="spark-line" />}
      {pts.map((p) => (
        <circle key={p.date} cx={x(p.date)} cy={y(p.value)} r={1.6} className="spark-pt" />
      ))}
      {lastIsToday && <circle cx={x(last.date)} cy={y(last.value)} r={3.6} className={`spark-now ${reading.level}`} />}
    </svg>
  )
}
