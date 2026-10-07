import { useMemo, useState } from 'react'
import { useApp } from '../context'
import { demoState } from '../lib/demo'
import { readAll } from '../lib/baseline'
import { DOMAINS, INDICATORS } from '../lib/indicators'
import data from '../data/glds53.json'
import { TetherRing } from '../components/TetherRing'
import { Logo } from '../components/Icons'

const REPO = 'https://github.com/MdMusfiqurRahmanAkib/tether'
const s = data.summary

// the genes measured in all six astronauts that changed in every one of them
const moved = data.genes
  .filter((g) => g.n === 6 && !g.housekeeping && g.up + g.down === 6)
  .sort((a, b) => b.up - a.up || a.symbol.localeCompare(b.symbol))

const HAZARDS = ['Space radiation', 'Isolation and confinement', 'Altered gravity', 'A hostile, closed environment']

const STEPS = [
  {
    title: 'Check in',
    text: `Log ${INDICATORS.length} indicators in about two minutes: sleep, mood, pulse, blood pressure, temperature, symptoms, exercise and more. A built-in 3-minute reaction test measures alertness.`,
  },
  {
    title: 'Compare',
    text: 'Each value is compared with your own preflight baseline, not a population average. Values outside your usual range are marked Watch or Act.',
  },
  {
    title: 'Act',
    text: 'Every flag opens a short on-board checklist, written like a crew procedure, with a clear rule for when to call the flight surgeon.',
  },
]

export function Welcome() {
  const { setState, state, go } = useApp()
  const [setup, setSetup] = useState(false)
  const [name, setName] = useState('')
  const [launch, setLaunch] = useState('')

  const preview = useMemo(() => {
    const d = demoState()
    const last = d.entries[d.entries.length - 1].date
    return readAll(d.entries, d.profile, last)
  }, [])

  const openDemo = () => {
    setState(demoState())
    go('status')
  }

  const begin = () => {
    setState({
      ...state,
      profile: { ...state.profile, callsign: name.trim(), launchDate: launch || undefined },
      onboarded: true,
    })
    go('checkin')
  }

  return (
    <div className="land">
      <header className="land-top">
        <div className="brand" style={{ padding: 0 }}>
          <Logo size={26} />
          Tether
        </div>
        <nav className="land-links" aria-label="Project">
          <a href="#/evidence">The data</a>
          <a href="#/method">Method</a>
          <a href={REPO}>Source code</a>
        </nav>
      </header>

      <main>
        <section className="land-hero">
          <div className="land-hero-copy">
            <p className="land-kicker">NASA Space Apps Challenge project</p>
            <h1 className="land-h">A daily health self-check for astronauts on long missions.</h1>
            <p className="land-lede">
              Tether compares each crew member with their own preflight baseline, shows what has changed, and gives clear steps for what to do next. It runs
              offline and keeps all data on the device.
            </p>

            {state.onboarded ? (
              <div className="row">
                <button className="btn primary" onClick={() => go('status')}>
                  Open my status
                </button>
              </div>
            ) : setup ? (
              <div className="stack land-setup">
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
                  <button className="btn ghost" onClick={() => setSetup(false)}>
                    Back
                  </button>
                </div>
              </div>
            ) : (
              <div className="row">
                <button className="btn primary" onClick={openDemo}>
                  Explore with demo data
                </button>
                <button className="btn" onClick={() => setSetup(true)}>
                  Start my baseline
                </button>
              </div>
            )}
          </div>

          <figure className="land-ring">
            <div aria-hidden="true" inert>
              <TetherRing readings={preview} selected={null} onSelect={() => {}} center={<span className="xsmall muted">your baseline</span>} />
            </div>
            <figcaption className="xsmall muted">
              Each dot is one indicator. The further a dot sits from the ring, the further that value is from the person’s usual. Simulated demo crew member.
            </figcaption>
          </figure>
        </section>

        <section className="land-sec">
          <h2>The challenge</h2>
          <div className="land-two">
            <div>
              <blockquote className="land-quote">
                Build health monitoring software that gathers health indicators and enables astronauts to evaluate and act on the status of their health.
              </blockquote>
              <p className="ink2">
                On a long mission the nearest clinic is days or months away, and crew are the first to notice a change in themselves.
              </p>
            </div>
            <div>
              <h3>What crews are exposed to</h3>
              <ul className="land-list">
                {HAZARDS.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <p className="small ink2">The brief names four health risks: immune changes, bone loss, cardiovascular events and behavioral health.</p>
            </div>
          </div>
        </section>

        <section className="land-sec">
          <h2>How it works</h2>
          <ol className="land-steps">
            {STEPS.map((st, i) => (
              <li key={st.title}>
                <span className="land-step-n num">{i + 1}</span>
                <h3>{st.title}</h3>
                <p className="ink2">{st.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="land-sec">
          <h2>What the NASA data showed</h2>
          <p className="land-intro ink2">
            The design comes from NASA GeneLab study GLDS-53, which measured 234 stress-response genes in the blood of six Space Shuttle astronauts before
            launch and after landing. We re-analysed the deposited values one astronaut at a time.
          </p>

          <div className="land-two">
            <div className="land-stats">
              <div>
                <strong className="num">{s.nFull6Moved}</strong>
                <span>genes changed in all six astronauts</span>
              </div>
              <div>
                <strong className="num">{s.nUnanimous}</strong>
                <span>of them, {s.unanimous.join(', ')}, moved the same way in all six</span>
              </div>
              <div>
                <strong className="num">{s.nFull6Moved - s.nUnanimous}</strong>
                <span>went up in some astronauts and down in others</span>
              </div>
            </div>

            <figure className="land-agree">
              <div
                className="agree-grid"
                role="img"
                aria-label={`For each of ${moved.length} genes, how many of six astronauts showed an increase and how many a decrease after flight`}
              >
                {moved.map((g) => (
                  <div key={g.id} className="agree-col">
                    {g.lfc.map((v, i) => (
                      <i key={i} className={(v as number) > 0 ? 'up' : 'down'} />
                    ))}
                    <span className="agree-name">{g.symbol}</span>
                  </div>
                ))}
              </div>
              <figcaption className="xsmall muted">
                One column per gene, one square per astronaut (A to F, top to bottom). <i className="key up" /> rose after flight <i className="key down" /> fell
                after flight.
              </figcaption>
            </figure>
          </div>

          <p className="land-take">
            The same flight pushed the same gene in opposite directions in different people. A population average would hide that, so Tether judges every
            indicator against the person’s own baseline.
          </p>
          <p className="small ink2">
            With six astronauts the evidence is limited: {s.nP05} of {s.nTested} tested genes reach p &lt; 0.05 and none survive correction for multiple
            testing. The results guided the design. They are not clinical markers.
          </p>
          <div className="row" style={{ marginTop: 16 }}>
            <a className="btn" href="#/evidence">
              See the full analysis
            </a>
            <a className="btn ghost" href="#/method">
              Read the method and references
            </a>
          </div>
        </section>

        <section className="land-sec">
          <h2>What Tether tracks</h2>
          <div className="land-domains">
            {DOMAINS.map((d) => (
              <div key={d.id}>
                <h3>{d.name}</h3>
                <p className="small ink2">{d.why}</p>
                <p className="xsmall muted">
                  {INDICATORS.filter((i) => i.domain === d.id)
                    .map((i) => i.label)
                    .join(', ')}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="land-sec">
          <h2>Why it can be trusted</h2>
          <ul className="land-list wide">
            <li>
              <strong>Simple, visible rules.</strong> No machine learning. Every flag follows a written rule that can be checked by hand.
            </li>
            <li>
              <strong>Reproducible analysis.</strong> The script and the original NASA files are in the repository. Our values match the authors’ published
              table with 0 mismatches.
            </li>
            <li>
              <strong>Works without a ground link.</strong> The app runs offline after the first load and never sends health data anywhere.
            </li>
            <li>
              <strong>Honest about limits.</strong> Tether does not diagnose and does not replace the flight surgeon.
            </li>
          </ul>
        </section>
      </main>

      <footer className="land-foot small ink2">
        <p>
          Data: NASA Open Science Data Repository, <a href="https://doi.org/10.25966/qsf7-cr81">OSD-53 / GLDS-53</a>. Paper: Barrila J et al.,{' '}
          <a href="https://doi.org/10.1038/npjmgrav.2016.39">npj Microgravity 2, 16039 (2016)</a>.
        </p>
        <p>
          Built by Md. Musfiqur Rahman Akib, Chittagong Independent University. <a href={REPO}>Source code on GitHub</a>.
        </p>
      </footer>
    </div>
  )
}
