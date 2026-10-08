import { Fragment, useMemo, useState } from 'react'
import { useApp } from '../context'
import { demoState } from '../lib/demo'
import { readAll } from '../lib/baseline'
import { DOMAINS, INDICATORS } from '../lib/indicators'
import { flightDay } from '../lib/store'
import data from '../data/glds53.json'
import { IconCheck } from '../components/Icons'
import { Board, DriftRow } from './Status'
import { ProcCard } from './Act'
import { IndicatorField } from './CheckIn'

const s = data.summary

// the genes measured in all six astronauts that changed in every one of them
const moved = data.genes
  .filter((g) => g.n === 6 && !g.housekeeping && g.up + g.down === 6)
  .sort((a, b) => b.up - a.up || a.symbol.localeCompare(b.symbol))

const HAZARDS = ['Space radiation', 'Isolation and confinement', 'Altered gravity', 'A hostile, closed environment']
const RISKS = ['Immune changes', 'Bone loss', 'Cardiovascular events', 'Behavioral health']

const TRUST = [
  {
    title: 'Simple, visible rules',
    text: 'No machine learning. Every flag follows a written rule that can be checked by hand, and the rules are covered by automated tests.',
  },
  {
    title: 'Reproducible analysis',
    text: 'The analysis script and the original NASA files are in the repository. Our values match the authors’ published table with 0 mismatches.',
  },
  {
    title: 'Works without a ground link',
    text: 'The app runs offline after the first load. Health data never leaves the device unless the crew member exports it.',
  },
  {
    title: 'Honest about limits',
    text: 'Six astronauts and one dataset cannot prove a clinical effect. Asstra does not diagnose and does not replace the flight surgeon.',
  },
]

const FAQ = [
  {
    q: 'Is Asstra a medical device?',
    a: 'No. Asstra does not diagnose and does not replace the flight surgeon. It helps a crew member notice a change early and decide when to raise it.',
  },
  {
    q: 'Where is my data stored?',
    a: 'In this browser, on this device. Nothing is uploaded and there is no account. You can export a CSV file or a backup from Settings at any time.',
  },
  {
    q: 'Does it need an internet connection?',
    a: 'Only for the first load. After that the app is cached on the device and works without a connection.',
  },
  {
    q: 'Is the demo data real?',
    a: 'No. The demo crew member is simulated so the app can be explored without entering anything. It is labelled as demo data wherever it appears.',
  },
  {
    q: 'How does Asstra decide what to flag?',
    a: 'It takes the median of your baseline check-ins as your usual value and measures how far today is from it, compared with your normal day-to-day variation. Twice that variation is Watch, three times is Act, and three Watch days in a row also become Act. Hard limits, such as a temperature of 38.0 °C or more, always trigger Act.',
  },
  {
    q: 'The NASA study is about genes. Why does Asstra track daily signs?',
    a: 'Asstra does not measure gene expression. The study is used for one lesson: the same flight changed the same genes in opposite directions in different astronauts, so a personal baseline is a better yardstick than a population average.',
  },
  {
    q: 'Can the analysis be checked?',
    a: 'Yes. The script and the original files are in the repository, and the data page lists every tested gene with its values.',
  },
]

const TRY_FIELDS = ['sleepHours', 'restingHr', 'mood', 'stress']
const TREND_ROWS = ['sleepHours', 'restingHr', 'exerciseMin']

export function Home({ onDemo }: { onDemo: () => void }) {
  const { setState, state, go } = useApp()
  const [setup, setSetup] = useState(false)
  const [name, setName] = useState('')
  const [launch, setLaunch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({ sleepHours: '6.5', mood: '4' })
  const [done, setDone] = useState<Record<string, boolean>>({})

  const demo = useMemo(() => {
    const d = demoState()
    const last = d.entries[d.entries.length - 1].date
    return { ...d, last, readings: readAll(d.entries, d.profile, last) }
  }, [])
  const reading = (id: string) => demo.readings.find((r) => r.indicator.id === id)!
  const fd = flightDay(demo.last, demo.profile)

  const begin = () => {
    setState({
      ...state,
      profile: { ...state.profile, callsign: name.trim(), launchDate: launch || undefined },
      onboarded: true,
    })
    go('checkin')
  }

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="hero-copy">
            <p className="kicker">NASA Space Apps Challenge project</p>
            <h1>A daily health self-check for astronauts on long missions.</h1>
            <p className="lede">
              Asstra compares each crew member with their own preflight baseline, shows what has changed, and gives clear steps for what to do next.
            </p>

            {state.onboarded ? (
              <div className="row">
                <button className="btn primary big" onClick={() => go('status')}>
                  Open my status
                </button>
                <a className="btn big" href="#/method">
                  Read how it works
                </a>
              </div>
            ) : setup ? (
              <div className="stack hero-setup">
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
                <button className="btn primary big" onClick={onDemo}>
                  Explore the demo
                </button>
                <button className="btn big" onClick={() => setSetup(true)}>
                  Start my own baseline
                </button>
              </div>
            )}

            <ul className="hero-points">
              <li>
                <IconCheck /> Works offline
              </li>
              <li>
                <IconCheck /> Data stays on the device
              </li>
              <li>
                <IconCheck /> Every flag follows a written rule
              </li>
            </ul>
          </div>

          <figure className="shot">
            <div className="shot-bar">
              <span>Status screen</span>
              <span className="demo-flag num">Simulated crew member, flight day {fd}</span>
            </div>
            <Board readings={demo.readings} entries={demo.entries} profile={demo.profile} viewDate={demo.last} selected={selected} onSelect={setSelected} />
            <figcaption className="small ink2">
              This is the working Status screen with simulated data. Each dot is one indicator; the further it sits from the ring, the further that value is
              from the person’s usual. Select a dot to see the value behind it.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="band" aria-label="At a glance">
        <div className="wrap stats">
          <div>
            <strong className="num">{INDICATORS.length}</strong>
            <span>health indicators in one check-in</span>
          </div>
          <div>
            <strong className="num">{DOMAINS.length}</strong>
            <span>areas of health covered</span>
          </div>
          <div>
            <strong className="num">2 min</strong>
            <span>is about what a daily check-in takes</span>
          </div>
          <div>
            <strong className="num">0</strong>
            <span>health data sent off the device</span>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head">
            <h2>The challenge</h2>
            <p>On a long mission the nearest clinic is days or months away, and crew are the first to notice a change in themselves.</p>
          </div>
          <div className="two">
            <figure className="quote">
              <blockquote>
                Build health monitoring software that gathers health indicators and enables astronauts to evaluate and act on the status of their health.
              </blockquote>
              <figcaption className="small muted">From the challenge brief on astronaut health self-monitoring</figcaption>
            </figure>
            <div className="two tight">
              <div>
                <h3>What crews are exposed to</h3>
                <ul className="plain">
                  {HAZARDS.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Health risks named in the brief</h3>
                <ul className="plain">
                  {RISKS.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec alt">
        <div className="wrap">
          <div className="sec-head">
            <h2>How it works</h2>
            <p>Three steps, once a day. The panels below are the working parts of the app, not pictures.</p>
          </div>

          <ol className="steps">
            <li className="step">
              <div className="step-copy">
                <span className="step-n num">1</span>
                <h3>Check in</h3>
                <p>
                  Log {INDICATORS.length} indicators in about two minutes: sleep, mood, pulse, blood pressure, temperature, symptoms, exercise and more. A
                  built-in 3-minute reaction test measures alertness. Anything you did not measure can be skipped.
                </p>
              </div>
              <div className="panel flat step-demo">
                <div className="ci-grid">
                  {TRY_FIELDS.map((id) => {
                    const r = reading(id)
                    return (
                      <IndicatorField
                        key={id}
                        ind={r.indicator}
                        value={draft[id] ?? ''}
                        usual={r.median}
                        onChange={(v) => setDraft((d) => ({ ...d, [id]: v }))}
                      />
                    )
                  })}
                </div>
              </div>
            </li>

            <li className="step">
              <div className="step-copy">
                <span className="step-n num">2</span>
                <h3>Compare</h3>
                <p>
                  Each value is compared with your own preflight baseline, not a population average. Outside your usual range is marked Watch. Far outside,
                  or outside for three days in a row, is marked Act. Hard limits such as a fever always count.
                </p>
              </div>
              <div className="panel flat step-demo">
                <div className="drift-list">
                  {TREND_ROWS.map((id) => (
                    <DriftRow key={id} r={reading(id)} endDate={demo.last} />
                  ))}
                </div>
                <p className="xsmall muted step-note">The shaded band is this person’s usual range. The last dot is today. Simulated data.</p>
              </div>
            </li>

            <li className="step">
              <div className="step-copy">
                <span className="step-n num">3</span>
                <h3>Act</h3>
                <p>
                  Every flag opens a short on-board checklist written like a crew procedure. Each one ends with a clear rule for when to call the flight
                  surgeon.
                </p>
              </div>
              <div className="step-demo">
                <ProcCard r={reading('sleepHours')} done={done} onToggle={(k, on) => setDone((d) => ({ ...d, [k]: on }))} />
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head">
            <h2>What the NASA data showed</h2>
            <p>
              The design comes from NASA GeneLab study GLDS-53, which measured 234 stress-response genes in the blood of six Space Shuttle astronauts before
              launch and after landing. We re-analysed the deposited values one astronaut at a time.
            </p>
          </div>

          <div className="two">
            <div className="figures">
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

            <figure className="panel flat agree">
              <div
                className="agree-grid"
                role="img"
                aria-label={`For each of ${moved.length} genes, how many of six astronauts showed an increase and how many a decrease after flight`}
              >
                {data.astronauts.map((a, i) => (
                  <Fragment key={a.id}>
                    <b>{a.id}</b>
                    {moved.map((g) => (
                      <i key={g.id} className={(g.lfc[i] as number) > 0 ? 'up' : 'down'} />
                    ))}
                  </Fragment>
                ))}
                <span />
                {moved.map((g) => (
                  <span key={g.id} className="agree-name">
                    {g.symbol}
                  </span>
                ))}
              </div>
              <figcaption className="xsmall muted">
                One column per gene, one row per astronaut. <i className="key up" /> rose after flight{' '}
                <i className="key down" /> fell after flight
              </figcaption>
            </figure>
          </div>

          <p className="takeaway">
            The same flight pushed the same gene in opposite directions in different people. A population average would hide that, so Asstra judges every
            indicator against the person’s own baseline.
          </p>
          <p className="small ink2">
            With six astronauts the evidence is limited: {s.nP05} of {s.nTested} tested genes reach p &lt; 0.05 and none survive correction for multiple
            testing. The results guided the design. They are not clinical markers.
          </p>
          <div className="row" style={{ marginTop: 20 }}>
            <a className="btn" href="#/evidence">
              See the full analysis
            </a>
            <a className="btn ghost" href="#/method">
              Read the method and references
            </a>
          </div>
        </div>
      </section>

      <section className="sec alt">
        <div className="wrap">
          <div className="sec-head">
            <h2>What Asstra tracks</h2>
            <p className="num">
              {INDICATORS.length} indicators across {DOMAINS.length} areas of health, plus the reading from the personal radiation dosimeter.
            </p>
          </div>
          <div className="cards three">
            {DOMAINS.map((d) => (
              <div key={d.id} className="card">
                <h3>{d.name}</h3>
                <p className="small ink2">{d.why}</p>
                <ul className="tags">
                  {INDICATORS.filter((i) => i.domain === d.id).map((i) => (
                    <li key={i.id}>{i.label}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head">
            <h2>Why it can be trusted</h2>
          </div>
          <div className="cards two-up">
            {TRUST.map((t) => (
              <div key={t.title} className="card">
                <h3>{t.title}</h3>
                <p className="ink2">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec alt">
        <div className="wrap">
          <div className="sec-head">
            <h2>Common questions</h2>
          </div>
          <div className="faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p className="ink2">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="cta">
            <div>
              <h2>See it with a simulated crew member</h2>
              <p>No sign-up and nothing to install. The demo opens on flight day {fd} of a six-month mission.</p>
            </div>
            <div className="row">
              {state.onboarded ? (
                <button className="btn primary big" onClick={() => go('status')}>
                  Open my status
                </button>
              ) : (
                <button className="btn primary big" onClick={onDemo}>
                  Explore the demo
                </button>
              )}
              <a className="btn big" href="#/method">
                Read how it works
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
