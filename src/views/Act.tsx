import { useMemo, useState } from 'react'
import { useApp } from '../context'
import { readAll } from '../lib/baseline'
import { PROTOCOLS } from '../lib/protocols'
import { fmt } from '../lib/format'
import { formatDate } from '../lib/store'

export function Act() {
  const { state, today, go } = useApp()
  const last = state.entries[state.entries.length - 1]
  const viewDate = state.entries.some((e) => e.date === today) || !last ? today : last.date
  const readings = useMemo(() => readAll(state.entries, state.profile, viewDate), [state, viewDate])
  const flagged = readings
    .filter((r) => r.level === 'act' || r.level === 'watch')
    .sort((a, b) => (a.level === b.level ? (b.concernZ ?? 0) - (a.concernZ ?? 0) : a.level === 'act' ? -1 : 1))

  const [done, setDone] = useState<Record<string, boolean>>({})

  return (
    <div className="stack" style={{ gap: 28 }}>
      <div className="page-head">
        <div>
          <h1>What to do</h1>
          <p>
            Steps for anything outside your baseline on {formatDate(viewDate, { day: 'numeric', month: 'long' })}. They support the flight surgeon’s care and
            never replace it.
          </p>
        </div>
      </div>

      {flagged.length === 0 ? (
        <div className="panel empty">
          <h2 className="h3">Nothing needs action</h2>
          <p className="ink2 small">Your logged indicators sit within your usual range. A check-in each day keeps it that way.</p>
          <div>
            <button className="btn primary" onClick={() => go('checkin')}>
              Check in
            </button>
          </div>
        </div>
      ) : (
        <div className="act-list">
          {flagged.map((r) => {
            const p = PROTOCOLS[r.indicator.id]
            if (!p) return null
            return (
              <article key={r.indicator.id} className={`panel proc ${r.level}`} aria-labelledby={`p-${r.indicator.id}`}>
                <header className="proc-head">
                  <span className={`chip ${r.level}`}>{r.level === 'act' ? 'Act' : 'Watch'}</span>
                  <span className="small ink2">
                    {r.indicator.label}, <span className="num">{fmt(r.value!, r.indicator)}</span>
                    {r.median !== undefined && <span className="num">, usually {fmt(r.median, r.indicator)}</span>}
                  </span>
                </header>
                <h2 id={`p-${r.indicator.id}`} className="h3 proc-title">
                  {p.title}
                </h2>
                <p className="xsmall muted">Flagged because: {r.reasons.join('; ')}.</p>
                <ol className="proc-steps">
                  {p.steps.map((s, i) => {
                    const k = `${r.indicator.id}-${i}`
                    return (
                      <li key={k}>
                        <label>
                          <input type="checkbox" checked={!!done[k]} onChange={(e) => setDone((d) => ({ ...d, [k]: e.target.checked }))} />
                          <span>{s}</span>
                        </label>
                      </li>
                    )
                  })}
                </ol>
                <p className="proc-escalate small">{p.escalate}</p>
              </article>
            )
          })}
        </div>
      )}

      <aside className="panel flat small ink2">
        <h2 className="h3 ink" style={{ marginBottom: 6 }}>
          Emergencies
        </h2>
        <p>
          Chest pain, trouble breathing, sudden severe headache, sudden vision loss, confusion or fainting: stop and call the flight surgeon through the
          emergency channel. Do not wait for a check-in.
        </p>
      </aside>
    </div>
  )
}
