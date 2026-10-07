import { describe, expect, it } from 'vitest'
import { median, read, robustSpread } from './baseline'
import { INDICATORS } from './indicators'
import type { Entry, Profile } from './store'

const profile: Profile = { callsign: '', launchDate: '2026-01-10', exerciseTarget: 120, priorDose: 0 }
const ind = (id: string) => INDICATORS.find((i) => i.id === id)!
const entry = (date: string, values: Entry['values'], symptoms: Entry['symptoms'] = []): Entry => ({ date, values, symptoms })

// five preflight days with the same value, so the spread falls back to minSpread
const preflight = (id: string, value: number) =>
  ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05'].map((d) => entry(d, { [id]: value }))

const levelOf = (id: string, entries: Entry[], date: string) => read(ind(id), entries, profile, date).level

describe('median and spread', () => {
  it('takes the middle value, or the mean of the two middle values', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })

  it('scales the median absolute deviation by 1.4826', () => {
    expect(robustSpread([1, 2, 3, 4, 5])).toBeCloseTo(1.4826)
  })
})

describe('flags against the personal baseline', () => {
  const base = preflight('restingHr', 60) // usual 60 bpm, spread floored at 3 bpm

  it('is ok inside 2 spreads, watch at 2, act at 3', () => {
    expect(levelOf('restingHr', [...base, entry('2026-01-10', { restingHr: 63 })], '2026-01-10')).toBe('ok')
    expect(levelOf('restingHr', [...base, entry('2026-01-10', { restingHr: 66 })], '2026-01-10')).toBe('watch')
    expect(levelOf('restingHr', [...base, entry('2026-01-10', { restingHr: 69 })], '2026-01-10')).toBe('act')
  })

  it('counts both directions for heart rate', () => {
    expect(levelOf('restingHr', [...base, entry('2026-01-10', { restingHr: 54 })], '2026-01-10')).toBe('watch')
  })

  it('ignores the harmless direction', () => {
    const sleep = preflight('sleepHours', 7)
    expect(levelOf('sleepHours', [...sleep, entry('2026-01-10', { sleepHours: 9.5 })], '2026-01-10')).toBe('ok')
    expect(levelOf('sleepHours', [...sleep, entry('2026-01-10', { sleepHours: 5.5 })], '2026-01-10')).toBe('act')
  })

  it('turns a third watch day in a row into act', () => {
    const days = [
      ...base,
      entry('2026-01-10', { restingHr: 66 }),
      entry('2026-01-11', { restingHr: 66 }),
      entry('2026-01-12', { restingHr: 66 }),
    ]
    expect(levelOf('restingHr', days, '2026-01-11')).toBe('watch')
    expect(levelOf('restingHr', days, '2026-01-12')).toBe('act')
  })

  it('does not put the day being judged into its own baseline', () => {
    const r = read(ind('restingHr'), [...base, entry('2026-01-10', { restingHr: 90 })], profile, '2026-01-10')
    expect(r.baseline).toEqual([60, 60, 60, 60, 60])
  })
})

describe('learning and hard limits', () => {
  it('reports building with fewer than five baseline values', () => {
    const days = [entry('2026-01-01', { restingHr: 60 }), entry('2026-01-02', { restingHr: 90 })]
    expect(levelOf('restingHr', days, '2026-01-02')).toBe('building')
  })

  it('still applies hard limits while learning', () => {
    expect(levelOf('temperature', [entry('2026-01-01', { temperature: 38 })], '2026-01-01')).toBe('act')
    expect(levelOf('systolic', [entry('2026-01-01', { systolic: 140 })], '2026-01-01')).toBe('act')
    expect(levelOf('nearVision', [entry('2026-01-01', { nearVision: 1 })], '2026-01-01')).toBe('act')
  })

  it('flags exercise below 75% of the plan', () => {
    const days = [...preflight('exerciseMin', 90), entry('2026-01-10', { exerciseMin: 85 })]
    expect(levelOf('exerciseMin', days, '2026-01-10')).toBe('watch')
  })

  it('flags a lip blister or a rash, and two symptoms together', () => {
    const base = preflight('symptoms', 0)
    expect(levelOf('symptoms', [...base, entry('2026-01-10', { symptoms: 1 }, ['rash'])], '2026-01-10')).toBe('watch')
    expect(levelOf('symptoms', [...base, entry('2026-01-10', { symptoms: 2 }, ['cough', 'fatigue'])], '2026-01-10')).toBe('act')
  })

  it('returns none when nothing was logged', () => {
    expect(levelOf('restingHr', preflight('restingHr', 60), '2026-01-10')).toBe('none')
  })
})
