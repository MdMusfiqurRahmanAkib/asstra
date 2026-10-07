import { useMemo, useState } from 'react'
import { useApp } from '../context'
import { demoState } from '../lib/demo'
import { readAll } from '../lib/baseline'
import { TetherRing } from '../components/TetherRing'
import { Logo } from '../components/Icons'

export function Welcome() {
  const { setState, state, go } = useApp()
  const [step, setStep] = useState<'intro' | 'setup'>('intro')
  const [name, setName] = useState('')
  const [launch, setLaunch] = useState('')

  const preview = useMemo(() => {
    const d = demoState()
    const last = d.entries[d.entries.length - 1].date
    return readAll(d.entries, d.profile, last)
  }, [])

  const begin = () => {
    setState({
      ...state,
      profile: { ...state.profile, callsign: name.trim(), launchDate: launch || undefined },
      onboarded: true,
    })
    go('checkin')
  }

  return (
    <main className="welcome">
      <div className="welcome-copy">
        <div className="brand" style={{ padding: 0 }}>
          <Logo size={30} />
          Tether
        </div>

        {step === 'intro' ? (
          <>
            <h1 className="welcome-h">Notice when you drift from your own normal.</h1>
            <p className="welcome-lede">
              A daily self-check for long-duration crews. Log sleep, mood, pulse, symptoms and exercise in about two minutes. Tether compares each one with your
              own preflight baseline and tells you what to watch and what to do.
            </p>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn primary" onClick={() => setStep('setup')}>
                Start my baseline
              </button>
              <button
                className="btn"
                onClick={() => {
                  setState(demoState())
                  go('status')
                }}
              >
                Explore with demo data
              </button>
            </div>
            <p className="xsmall muted welcome-foot">
              Why your own baseline and not a population range: in NASA GeneLab study GLDS-53, the same flight moved the same genes in different directions in
              different astronauts.{' '}
              <a
                href="#/evidence"
                onClick={(e) => {
                  e.preventDefault()
                  setState({ ...demoState() })
                  go('evidence')
                }}
              >
                See the data
              </a>
            </p>
          </>
        ) : (
          <div className="stack" style={{ maxWidth: 420 }}>
            <h1 className="welcome-h" style={{ fontSize: 'var(--s4)' }}>
              Two details to start
            </h1>
            <div className="field">
              <label htmlFor="w-name">Name or call sign</label>
              <input id="w-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <div className="field">
              <label htmlFor="w-launch">Launch date</label>
              <input id="w-launch" type="date" className="input num" value={launch} onChange={(e) => setLaunch(e.target.value)} />
              <span className="hint">
                Check-ins before launch become your baseline. Without a date, your first seven check-ins are used. You can change this later.
              </span>
            </div>
            <div className="row">
              <button className="btn primary" onClick={begin}>
                Continue to first check-in
              </button>
              <button className="btn ghost" onClick={() => setStep('intro')}>
                Back
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="welcome-ring" aria-hidden="true" inert>
        <TetherRing readings={preview} selected={null} onSelect={() => {}} center={<span className="xsmall muted">your baseline</span>} />
      </div>
    </main>
  )
}
