import type { Indicator } from './indicators'

export function decimals(ind: Indicator) {
  if (!ind.step || ind.step >= 1) return 0
  if (ind.step === 0.25) return 2
  return 1
}

export function fmtNum(v: number, ind: Indicator) {
  if (ind.kind === 'flag') return v >= 1 ? 'Yes' : 'No'
  const d = decimals(ind)
  const s = v.toFixed(d)
  return d === 2 ? s.replace(/\.?0+$/, '') : s
}

export function fmt(v: number, ind: Indicator) {
  const n = fmtNum(v, ind)
  if (ind.kind === 'flag') return n
  if (ind.kind === 'scale') return `${n} of 5`
  if (!ind.unit) return n
  return ind.unit.startsWith('/') || ind.unit === '°C' ? `${n}${ind.unit === '°C' ? ' °C' : ind.unit}` : `${n} ${ind.unit}`
}

export const levelWords: Record<string, string> = {
  none: 'Not logged today',
  building: 'Building baseline',
  ok: 'Within your baseline',
  watch: 'Watch',
  act: 'Act now',
}
