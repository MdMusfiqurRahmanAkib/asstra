import { useRef, useState } from 'react'
import { useApp } from '../context'
import { INDICATORS, SYMPTOMS } from '../lib/indicators'
import { emptyState, type State } from '../lib/store'
import { demoState } from '../lib/demo'

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function Settings() {
  const { state, setState, setProfile, toast, go } = useApp()
  const p = state.profile
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const exportJson = () => download(`astra-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(state, null, 2), 'application/json')

  const exportCsv = () => {
    const cols = ['date', ...INDICATORS.map((i) => i.id), ...SYMPTOMS.map((s) => `symptom_${s.id}`), 'dose_mission_mSv', 'note']
    const rows = state.entries.map((e) =>
      [
        e.date,
        ...INDICATORS.map((i) => e.values[i.id] ?? ''),
        ...SYMPTOMS.map((s) => (e.symptoms.includes(s.id) ? 1 : 0)),
        e.doseCum ?? '',
        `"${(e.note ?? '').replace(/"/g, '""')}"`,
      ].join(','),
    )
    download(`astra-${new Date().toISOString().slice(0, 10)}.csv`, [cols.join(','), ...rows].join('\n'), 'text/csv')
  }

  const importJson = async (f: File) => {
    try {
      const parsed = JSON.parse(await f.text()) as State
      if (parsed.version !== 1 || !Array.isArray(parsed.entries)) throw new Error('format')
      setState({ ...emptyState(), ...parsed, onboarded: true })
      toast(`Imported ${parsed.entries.length} check-ins`)
    } catch {
      toast('That file is not an Astra export')
    }
  }

  return (
    <div className="stack" style={{ gap: 28 }}>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p>Your data stays on this device. Nothing is sent anywhere.</p>
        </div>
      </div>

      <section className="panel flat stack" aria-labelledby="s-mission">
        <h2 id="s-mission" className="h3">
          You and your mission
        </h2>
        <div className="set-grid">
          <div className="field">
            <label htmlFor="s-name">Name or call sign</label>
            <input id="s-name" className="input" value={p.callsign} onChange={(e) => setProfile({ callsign: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="s-launch">Launch date</label>
            <input id="s-launch" type="date" className="input num" value={p.launchDate ?? ''} onChange={(e) => setProfile({ launchDate: e.target.value || undefined })} />
            <span className="hint">Check-ins before this date form your baseline.</span>
          </div>
          <div className="field">
            <label htmlFor="s-land">Planned landing</label>
            <input id="s-land" type="date" className="input num" value={p.landingDate ?? ''} onChange={(e) => setProfile({ landingDate: e.target.value || undefined })} />
          </div>
          <div className="field">
            <label htmlFor="s-ex">Daily exercise plan</label>
            <div className="unit-input">
              <input id="s-ex" className="input num" inputMode="numeric" value={p.exerciseTarget} onChange={(e) => setProfile({ exerciseTarget: Number(e.target.value) || 0 })} />
              <span className="muted small">min</span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="s-dose">Career dose before this mission</label>
            <div className="unit-input">
              <input id="s-dose" className="input num" inputMode="decimal" value={p.priorDose} onChange={(e) => setProfile({ priorDose: Number(e.target.value) || 0 })} />
              <span className="muted small">mSv</span>
            </div>
          </div>
        </div>
      </section>

      <section className="panel flat stack" aria-labelledby="s-data">
        <h2 id="s-data" className="h3">
          Your data
        </h2>
        <p className="small ink2 num">
          {state.entries.length} check-ins stored{state.demo ? ', all simulated demo data' : ''}. Export a copy before downlink or handover; CSV opens in any
          spreadsheet.
        </p>
        <div className="row">
          <button className="btn" onClick={exportCsv} disabled={!state.entries.length}>
            Export CSV
          </button>
          <button className="btn" onClick={exportJson} disabled={!state.entries.length}>
            Export backup
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Restore backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) importJson(f)
              e.target.value = ''
            }}
          />
        </div>
      </section>

      <section className="panel flat stack" aria-labelledby="s-demo">
        <h2 id="s-demo" className="h3">
          Demo and reset
        </h2>
        <p className="small ink2">
          The demo loads a simulated crew member 46 days into a six-month mission. It replaces what is stored here, so export first if you need your data.
        </p>
        <div className="row">
          <button
            className="btn"
            onClick={() => {
              setState(demoState())
              toast('Demo data loaded')
              go('status')
            }}
          >
            Load demo data
          </button>
          {!confirmClear ? (
            <button className="btn ghost danger" onClick={() => setConfirmClear(true)}>
              Erase everything
            </button>
          ) : (
            <span className="row">
              <span className="small">Erase all check-ins and settings?</span>
              <button
                className="btn danger"
                onClick={() => {
                  setState(emptyState())
                  toast('Everything erased')
                }}
              >
                Erase
              </button>
              <button className="btn ghost" onClick={() => setConfirmClear(false)}>
                Keep
              </button>
            </span>
          )}
        </div>
      </section>
    </div>
  )
}
