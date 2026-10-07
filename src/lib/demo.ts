import type { Entry, State } from './store'
import { addDays, todayISO } from './store'
import type { SymptomId } from './indicators'

/**
 * Simulated crew member for exploring the app. Every value here is generated, not measured,
 * and the interface labels it as demo data wherever it appears.
 */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function demoState(): State {
  const r = rng(53)
  const gauss = () => {
    const u = 1 - r()
    const v = r()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
  const n = (mu: number, sd: number) => mu + sd * gauss()
  const round = (x: number, step: number) => Number((Math.round(x / step) * step).toFixed(2))
  const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
  const scale = (mu: number) => clamp(Math.round(n(mu, 0.45)), 1, 5)

  const today = todayISO()
  const flightDays = 46
  const launch = addDays(today, -(flightDays - 1))
  const entries: Entry[] = []

  // Ten preflight sessions in the three weeks before launch.
  for (let i = 20; i >= 11; i--) {
    const date = addDays(launch, -i)
    entries.push({
      date,
      values: {
        sleepHours: round(n(7.2, 0.35), 0.25),
        sleepQuality: scale(4),
        mood: scale(4.2),
        stress: scale(2),
        connected: scale(4.3),
        reactionMs: Math.round(n(252, 9)),
        lapses: Math.max(0, Math.round(n(1, 0.7))),
        restingHr: Math.round(n(57, 1.8)),
        systolic: Math.round(n(117, 3.5)),
        diastolic: Math.round(n(75, 2.5)),
        temperature: round(n(36.7, 0.12), 0.1),
        symptoms: 0,
        exerciseMin: round(n(95, 12), 5),
        bodyMass: round(n(78.3, 0.25), 0.1),
        backPain: 0,
        headache: r() < 0.15 ? 1 : 0,
        nearVision: 0,
      },
      symptoms: [],
    })
  }

  for (let d = 1; d <= flightDays; d++) {
    const date = addDays(launch, d - 1)
    if (d > 3 && d < flightDays - 4 && r() < 0.12) continue // a few unlogged days
    const late = d >= flightDays - 2 // last three days
    const symptoms: SymptomId[] = []
    if (d === flightDays - 1 || d === flightDays) symptoms.push('lipLesion')
    const vals = {
      sleepHours: round(late ? n(5.2, 0.2) : n(6.5, 0.45), 0.25),
      sleepQuality: late ? scale(2.4) : scale(3.6),
      mood: d > 30 ? scale(3.5) : scale(4),
      stress: late ? scale(3.4) : scale(2.4),
      connected: d > 30 ? scale(3.4) : scale(4),
      reactionMs: Math.round(late ? n(292, 6) : n(258 + d * 0.3, 9)),
      lapses: Math.max(0, Math.round(late ? n(5, 0.8) : n(1.3, 0.8))),
      restingHr: Math.round(n(59, 2)),
      systolic: Math.round(n(115, 4)),
      diastolic: Math.round(n(74, 3)),
      temperature: round(d === flightDays ? 37.0 : n(36.72, 0.12), 0.1),
      symptoms: symptoms.length,
      exerciseMin: round(d < 4 ? n(40, 10) : late ? n(85, 6) : n(126, 12), 5),
      bodyMass: round(78.3 - 0.012 * d + n(0, 0.15), 0.1),
      backPain: d <= 9 ? Math.round(clamp(n(4 - d * 0.35, 0.8), 0, 10)) : r() < 0.1 ? 1 : 0,
      headache: d <= 4 ? 2 : d < flightDays && r() < 0.12 ? 2 : 0,
      nearVision: 0,
    }
    entries.push({
      date,
      values: vals,
      symptoms,
      doseCum: Math.round(d * 0.45 * 10) / 10,
      note: d === flightDays ? 'Long EVA prep day. Woke twice from fan noise.' : undefined,
    })
  }

  return {
    version: 1,
    profile: {
      callsign: 'Demo crew member',
      launchDate: launch,
      landingDate: addDays(launch, 179),
      exerciseTarget: 120,
      priorDose: 72,
    },
    entries,
    demo: true,
    onboarded: true,
  }
}
