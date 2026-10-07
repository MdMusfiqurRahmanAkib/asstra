import { useCallback, useEffect, useState } from 'react'
import type { SymptomId } from './indicators'

export interface Entry {
  date: string // YYYY-MM-DD, crew local time
  values: Partial<Record<string, number>>
  symptoms: SymptomId[]
  doseCum?: number // personal dosimeter reading for this mission, mSv
  note?: string
}

export interface Profile {
  callsign: string
  launchDate?: string
  landingDate?: string
  exerciseTarget: number // minutes per day
  priorDose: number // career dose before this mission, mSv
}

export interface State {
  version: 1
  profile: Profile
  entries: Entry[]
  demo: boolean
  onboarded: boolean
}

const KEY = 'tether.v1'

export const emptyState = (): State => ({
  version: 1,
  profile: { callsign: '', exerciseTarget: 120, priorDose: 0 },
  entries: [],
  demo: false,
  onboarded: false,
})

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as State
    if (parsed.version !== 1 || !Array.isArray(parsed.entries)) return emptyState()
    return { ...emptyState(), ...parsed, profile: { ...emptyState().profile, ...parsed.profile } }
  } catch {
    return emptyState()
  }
}

function save(state: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage unavailable: the session keeps working in memory */
  }
}

export function useStore() {
  const [state, setState] = useState<State>(load)

  useEffect(() => save(state), [state])

  const upsertEntry = useCallback((entry: Entry) => {
    setState((s) => {
      const others = s.entries.filter((e) => e.date !== entry.date)
      const entries = [...others, entry].sort((a, b) => a.date.localeCompare(b.date))
      return { ...s, entries }
    })
  }, [])

  const deleteEntry = useCallback((date: string) => {
    setState((s) => ({ ...s, entries: s.entries.filter((e) => e.date !== date) }))
  }, [])

  const setProfile = useCallback((p: Partial<Profile>) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...p } }))
  }, [])

  return { state, setState, upsertEntry, deleteEntry, setProfile }
}

export const todayISO = (d = new Date()) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d + n)
  return todayISO(dt)
}

export const daysBetween = (a: string, b: string) => {
  const [y1, m1, d1] = a.split('-').map(Number)
  const [y2, m2, d2] = b.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000)
}

export type Phase = 'preflight' | 'flight' | 'postflight' | 'unset'

export function phaseOf(date: string, p: Profile): Phase {
  if (!p.launchDate) return 'unset'
  if (date < p.launchDate) return 'preflight'
  if (p.landingDate && date > p.landingDate) return 'postflight'
  return 'flight'
}

/** Flight day 1 is launch day, matching how crews count. */
export function flightDay(date: string, p: Profile): number | null {
  if (!p.launchDate || date < p.launchDate) return null
  return daysBetween(p.launchDate, date) + 1
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, opts)
}
