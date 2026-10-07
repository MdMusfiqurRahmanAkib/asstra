import { INDICATORS, type Indicator } from './indicators'
import type { Entry, Profile } from './store'

export type Level = 'none' | 'building' | 'ok' | 'watch' | 'act'

export const MIN_BASELINE = 5
export const FALLBACK_BASELINE_DAYS = 7

export interface Reading {
  indicator: Indicator
  value?: number
  baseline: number[]
  median?: number
  spread?: number
  /** Signed robust z-score: how many spreads today sits from your baseline median. */
  z?: number
  /** Deviation in the direction that matters for this indicator (always >= 0 when concerning). */
  concernZ?: number
  level: Level
  reasons: string[]
  history: { date: string; value: number }[]
}

export function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b)
  const n = s.length
  if (!n) return NaN
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2
}

/** Median absolute deviation scaled to be comparable with a standard deviation. */
export function robustSpread(xs: number[]) {
  const m = median(xs)
  return 1.4826 * median(xs.map((x) => Math.abs(x - m)))
}

/**
 * Baseline entries: preflight days if a launch date is set and there are enough of them,
 * otherwise the first seven days with a value. Baseline never includes the day being judged.
 */
export function baselineFor(ind: Indicator, entries: Entry[], profile: Profile, upTo: string) {
  const withValue = entries.filter((e) => e.date < upTo && typeof e.values[ind.id] === 'number')
  if (profile.launchDate) {
    const pre = withValue.filter((e) => e.date < profile.launchDate!)
    if (pre.length >= MIN_BASELINE) return pre.map((e) => e.values[ind.id] as number)
  }
  return withValue.slice(0, FALLBACK_BASELINE_DAYS).map((e) => e.values[ind.id] as number)
}

function concernOf(ind: Indicator, z: number) {
  if (ind.concern === 'low') return -z
  if (ind.concern === 'high') return z
  return Math.abs(z)
}

function hitsHard(ind: Indicator, v: number) {
  if (!ind.hard) return false
  return ind.hard.op === '>=' ? v >= ind.hard.value : v <= ind.hard.value
}

function rawLevel(ind: Indicator, v: number, base: number[]): { level: Level; z?: number; cz?: number; m?: number; s?: number } {
  if (base.length < MIN_BASELINE) return { level: 'building' }
  const m = median(base)
  const s = Math.max(robustSpread(base), ind.minSpread)
  const z = (v - m) / s
  const cz = concernOf(ind, z)
  const level: Level = cz >= 3 ? 'act' : cz >= 2 ? 'watch' : 'ok'
  return { level, z, cz, m, s }
}

const rank: Record<Level, number> = { none: 0, building: 1, ok: 2, watch: 3, act: 4 }
export const worse = (a: Level, b: Level) => (rank[a] >= rank[b] ? a : b)

export function read(ind: Indicator, entries: Entry[], profile: Profile, date: string): Reading {
  const history = entries
    .filter((e) => e.date <= date && typeof e.values[ind.id] === 'number')
    .map((e) => ({ date: e.date, value: e.values[ind.id] as number }))
  const today = entries.find((e) => e.date === date)
  const value = today?.values[ind.id]
  const base = baselineFor(ind, entries, profile, date)
  const reasons: string[] = []

  if (typeof value !== 'number') {
    return { indicator: ind, baseline: base, level: 'none', reasons, history }
  }

  const r = rawLevel(ind, value, base)
  let level = r.level

  if (r.level === 'watch' || r.level === 'act') {
    const dir = (r.z ?? 0) > 0 ? 'above' : 'below'
    reasons.push(`${Math.abs(r.z ?? 0).toFixed(1)} spreads ${dir} your baseline`)
  }

  // Persistence: three logged days in a row outside baseline in the concerning direction.
  if (level === 'watch') {
    const prior = history.filter((h) => h.date < date).slice(-2)
    if (prior.length === 2) {
      const streak = prior.every((h) => {
        const b = baselineFor(ind, entries, profile, h.date)
        const pl = rawLevel(ind, h.value, b).level
        return pl === 'watch' || pl === 'act'
      })
      if (streak) {
        level = 'act'
        reasons.push('third day in a row outside your baseline')
      }
    }
  }

  if (hitsHard(ind, value)) {
    level = 'act'
    reasons.push(ind.hard!.note)
  }

  if (ind.id === 'exerciseMin' && profile.exerciseTarget > 0 && value < profile.exerciseTarget * 0.75) {
    level = worse(level, 'watch')
    reasons.push(`below 75% of your ${profile.exerciseTarget}-minute plan`)
  }

  if (ind.id === 'symptoms' && today) {
    if (today.symptoms.includes('lipLesion')) {
      level = worse(level, 'watch')
      reasons.push('lip blisters can mark herpes virus reactivation')
    }
    if (today.symptoms.includes('rash')) {
      level = worse(level, 'watch')
      reasons.push('skin rashes are one of the most reported in-flight immune signs')
    }
  }

  return {
    indicator: ind,
    value,
    baseline: base,
    median: r.m,
    spread: r.s,
    z: r.z,
    concernZ: r.cz,
    level,
    reasons,
    history,
  }
}

export function readAll(entries: Entry[], profile: Profile, date: string) {
  return INDICATORS.map((ind) => read(ind, entries, profile, date))
}

export function overall(readings: Reading[]): Level {
  return readings.reduce<Level>((acc, r) => worse(acc, r.level), 'none')
}
