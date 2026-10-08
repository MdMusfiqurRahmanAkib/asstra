import { useMemo, useState } from 'react'
import { useApp } from '../context'
import { readAll, type Reading } from '../lib/baseline'
import { DOMAINS } from '../lib/indicators'
import { flightDay, formatDate, phaseOf, daysBetween, type Entry, type Profile } from '../lib/store'
import { fmt, levelWords } from '../lib/format'
import { BaselineRing } from '../components/BaselineRing'
import { Spark } from '../components/Spark'

const CAREER_LIMIT = 600 // mSv, NASA-STD-3001 Vol. 1 Rev. B

export function Status() {
  const { state, today, go } = useApp()
  const { entries, profile } = state
  const [selected, setSelected] = useState<string | null>(null)
  const [intro, setIntro] = useState(true)

  const last = entries[entries.length - 1]
  const hasToday = entries.some((e) => e.date === today)
  const viewDate = hasToday || !last ? today : last.date
  const readings = useMemo(() => readAll(entries, profile, viewDate), [entries, profile, viewDate])

  const act = readings.filter((r) => r.level === 'act')
  const watch = readings.filter((r) => r.level === 'watch')
  const logged = readings.filter((r) => r.level !== 'none').length
  const building = readings.filter((r) => r.level === 'building').length
  const fd = flightDay(viewDate, profile)
  const phase = phaseOf(viewDate, profile)

  const headline = !entries.length
    ? 'Your first check-in starts your baseline'
    : act.length
      ? `${act.length === 1 ? 'One thing needs' : `${words(act.length)} things need`} action`
      : watch.length
        ? `${watch.length === 1 ? 'One thing' : `${words(watch.length)} things`} to watch`
        : building === logged && logged > 0
          ? 'Building your baseline'
          : 'Everything sits within your baseline'

  return (
    <div className="stack" style={{ gap: 28 }}>
      <div className="page-head">
        <div>
          <h1>{headline}</h1>
          <p className="num">
            {formatDate(viewDate, { weekday: 'long', day: 'numeric', month: 'long' })}
            {fd ? `, flight day ${fd}` : phase === 'preflight' ? `, ${daysBetween(viewDate, profile.launchDate!)} days to launch` : ''}
            {!hasToday && last ? '. Showing your last check-in.' : ''}
          </p>
        </div>
        <button className="btn primary" onClick={() => go('checkin')}>
          {hasToday ? 'Edit today’s check-in' : 'Check in for today'}
        </button>
      </div>

      {state.demo && intro && (
        <aside className="note" aria-label="About this demo">
          <p className="small">
            <strong>You are viewing a simulated crew member.</strong> Each dot on the ring is one indicator. A dot outside the ring has moved away from this
            person’s usual. Select a dot for the detail, or open Act for the steps.
          </p>
          <button className="btn ghost" onClick={() => setIntro(false)}>
            Hide
          </button>
        </aside>
      )}

      <Board
        readings={readings}
        entries={entries}
        profile={profile}
        viewDate={viewDate}
        selected={selected}
        onSelect={setSelected}
        onOpenSteps={() => go('act')}
      />

      <section aria-labelledby="all-h" className="stack" style={{ gap: 20 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 id="all-h">Every indicator</h2>
          <span className="xsmall muted">Band shows your usual range. Last three weeks.</span>
        </div>
        {DOMAINS.map((d) => {
          const rs = readings.filter((r) => r.indicator.domain === d.id)
          return (
            <div key={d.id} className="panel flat domain">
              <div className="domain-head">
                <h3>{d.name}</h3>
                <p className="xsmall muted">{d.why}</p>
              </div>
              <div className="drift-list">
                {rs.map((r) => (
                  <DriftRow
                    key={r.indicator.id}
                    r={r}
                    endDate={viewDate}
                    selected={selected === r.indicator.id}
                    onSelect={() => {
                      setSelected(r.indicator.id)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}

interface BoardProps {
  readings: Reading[]
  entries: Entry[]
  profile: Profile
  viewDate: string
  selected: string | null
  onSelect: (id: string | null) => void
  onOpenSteps?: () => void
}

/** The ring with the list of flagged indicators and the radiation dose beside it. */
export function Board({ readings, entries, profile, viewDate, selected, onSelect, onOpenSteps }: BoardProps) {
  const act = readings.filter((r) => r.level === 'act')
  const watch = readings.filter((r) => r.level === 'watch')
  const logged = readings.filter((r) => r.level !== 'none').length
  const sel = readings.find((r) => r.indicator.id === selected) ?? null
  const doseEntry = [...entries].reverse().find((e) => e.date <= viewDate && typeof e.doseCum === 'number')
  const dose = doseEntry ? (doseEntry.doseCum ?? 0) + profile.priorDose : null

  return (
    <div className="status-grid">
      <section className="panel ring-panel" aria-labelledby="ring-h">
        <h2 id="ring-h" className="sr-only">
          All indicators against your baseline
        </h2>
        <BaselineRing
          readings={readings}
          selected={selected}
          onSelect={onSelect}
          center={sel ? <RingDetail r={sel} /> : <RingSummary act={act.length} watch={watch.length} logged={logged} total={readings.length} />}
        />
        <div className="ring-legend xsmall ink2">
          <span>
            <i className="lg-ring" /> Your baseline
          </span>
          <span>
            <i className="lg-dash watch" /> Watch, outside your usual range
          </span>
          <span>
            <i className="lg-dash act" /> Act, far outside
          </span>
        </div>
      </section>

      <div className="stack">
        <section className="panel" aria-labelledby="attn-h">
          <h2 id="attn-h" className="h3">
            Needs your attention
          </h2>
          {act.length + watch.length === 0 ? (
            <p className="ink2 small" style={{ marginTop: 8 }}>
              {entries.length
                ? 'Nothing is outside your usual range. Keep checking in at the same time each day so the baseline stays honest.'
                : 'Log about a week of normal days and Asstra learns what usual looks like for you. Until then it only checks hard limits like fever.'}
            </p>
          ) : (
            <ul className="attn">
              {[...act, ...watch].map((r) => (
                <li key={r.indicator.id}>
                  <button className="attn-row" onClick={() => onSelect(r.indicator.id)} aria-pressed={selected === r.indicator.id}>
                    <span className={`chip ${r.level}`}>{r.level === 'act' ? 'Act' : 'Watch'}</span>
                    <span className="attn-name">{r.indicator.label}</span>
                    <span className="num ink2 small">{fmt(r.value!, r.indicator)}</span>
                  </button>
                  <p className="xsmall muted attn-why">{cap(r.reasons.join('; '))}.</p>
                </li>
              ))}
            </ul>
          )}
          {onOpenSteps && act.length + watch.length > 0 && (
            <button className="btn" style={{ marginTop: 14 }} onClick={onOpenSteps}>
              Open the steps
            </button>
          )}
        </section>

        <section className="panel" aria-labelledby="dose-h">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h2 id="dose-h" className="h3">
              Radiation dose
            </h2>
            <span className="xsmall muted">Career limit {CAREER_LIMIT} mSv</span>
          </div>
          {dose === null ? (
            <p className="small ink2" style={{ marginTop: 8 }}>
              Add your dosimeter reading in a check-in to track your career total.
            </p>
          ) : (
            <>
              <div className="dose-bar" role="img" aria-label={`${dose.toFixed(1)} of ${CAREER_LIMIT} millisieverts`}>
                <span style={{ width: `${Math.min(100, (profile.priorDose / CAREER_LIMIT) * 100)}%` }} className="prior" />
                <span style={{ width: `${Math.min(100, ((dose - profile.priorDose) / CAREER_LIMIT) * 100)}%` }} className="mission" />
              </div>
              <p className="small ink2 num" style={{ marginTop: 10 }}>
                <strong className="ink">{dose.toFixed(1)} mSv</strong> career total, {(doseEntry!.doseCum ?? 0).toFixed(1)} mSv this mission.{' '}
                {((dose / CAREER_LIMIT) * 100).toFixed(1)}% of the limit.
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

interface DriftProps {
  r: Reading
  endDate: string
  selected?: boolean
  onSelect?: () => void
}

/** One indicator: today's value, its three-week trend and its level. */
export function DriftRow({ r, endDate, selected, onSelect }: DriftProps) {
  const body = (
    <>
      <span className="drift-name">
        <span className="small">{r.indicator.label}</span>
        <span className="xsmall muted num">
          {r.median !== undefined ? `Usually ${fmt(r.median, r.indicator)}` : r.level === 'building' ? `Baseline ${r.baseline.length} of 5 days` : ''}
        </span>
      </span>
      <span className="drift-val num">{r.value !== undefined ? fmt(r.value, r.indicator) : '–'}</span>
      <span className="drift-spark">
        <Spark reading={r} endDate={endDate} />
      </span>
      <span className={`chip ${r.level}`}>{levelShort[r.level]}</span>
    </>
  )
  return onSelect ? (
    <button className={`drift ${selected ? 'sel' : ''}`} onClick={onSelect}>
      {body}
    </button>
  ) : (
    <div className="drift static">{body}</div>
  )
}

const levelShort: Record<string, string> = {
  none: 'No entry',
  building: 'Learning',
  ok: 'Usual',
  watch: 'Watch',
  act: 'Act',
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function words(n: number) {
  return ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'][n] ?? String(n)
}

function RingSummary({ act, watch, logged, total }: { act: number; watch: number; logged: number; total: number }) {
  return (
    <div className="rc">
      <div className="rc-big num">
        {logged}
        <span className="muted">/{total}</span>
      </div>
      <div className="xsmall ink2">indicators logged</div>
      <div className="rc-counts xsmall">
        <span style={{ color: 'var(--act)' }}>{act} act</span>
        <span style={{ color: 'var(--watch)' }}>{watch} watch</span>
      </div>
      <div className="xsmall muted rc-tip">Select a point for details</div>
    </div>
  )
}

function RingDetail({ r }: { r: Reading }) {
  const ind = r.indicator
  return (
    <div className="rc">
      <div className="xsmall ink2">{ind.label}</div>
      <div className="rc-big num" style={{ fontSize: 'var(--s4)' }}>
        {r.value !== undefined ? fmt(r.value, ind) : '–'}
      </div>
      {r.median !== undefined && <div className="xsmall muted num">usual {fmt(r.median, ind)}</div>}
      <span className={`chip ${r.level}`} style={{ marginTop: 8 }}>
        {levelWords[r.level]}
      </span>
    </div>
  )
}
