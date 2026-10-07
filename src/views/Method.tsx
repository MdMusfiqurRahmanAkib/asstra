import { MIN_BASELINE, FALLBACK_BASELINE_DAYS } from '../lib/baseline'
import { STUDY } from '../data/study'

export function Method() {
  return (
    <div className="stack" style={{ gap: 28 }}>
      <div className="page-head">
        <div>
          <h1>How Tether works</h1>
          <p>The rules behind every flag, the data behind the design, and what Tether does not do.</p>
        </div>
      </div>

      <article className="panel prose">
        <h2 style={{ marginTop: 0 }}>The question it answers</h2>
        <p>
          On a long mission the nearest clinic is days or months away, and crew are the first to notice change in themselves. Tether answers one question each
          day: is anything about me different from my own normal, and if so, what do I do about it?
        </p>

        <h2>Why a personal baseline</h2>
        <p>
          Population reference ranges are wide. A resting heart rate of 72 is normal for most people and a real change for someone whose usual is 56. The
          GeneLab data in this app point the same way: {STUDY.directionLine} So each indicator is compared with your own history, not a textbook range.
        </p>

        <h2>The rule for each indicator</h2>
        <ol>
          <li>
            Your baseline is the check-ins logged before launch. If there are fewer than {MIN_BASELINE} of those, Tether uses your first {FALLBACK_BASELINE_DAYS}{' '}
            check-ins instead. Until {MIN_BASELINE} values exist it only checks hard limits.
          </li>
          <li>
            Usual is the median of the baseline. Spread is the median absolute deviation multiplied by 1.4826, which matches a standard deviation for normally
            distributed data but is not thrown off by one odd day. Each indicator has a smallest meaningful spread, for example 3 bpm for heart rate, so a very
            steady baseline does not turn noise into alarms.
          </li>
          <li>
            Today’s distance from usual is measured in spreads, counted only in the direction that matters. Short sleep counts; long sleep does not.
          </li>
          <li>
            Two spreads out is Watch. Three spreads out is Act. Three Watch days in a row also become Act, because slow drift is the pattern that is hardest to
            notice from the inside.
          </li>
          <li>
            Hard limits override the baseline: a temperature of 38.0 °C or more, blood pressure of 140/90 or more, two or more immune symptoms on one day, or any
            new change in near vision.
          </li>
        </ol>

        <h2>What is measured and why</h2>
        <ul>
          <li>
            <strong>Sleep</strong> hours and quality. Astronauts averaged 6.0 hours a night on Shuttle missions and 6.1 hours on the ISS against 8.5 hours
            scheduled.
          </li>
          <li>
            <strong>Mood, stress and connection</strong>, scored 1 to 5, plus the 3-minute brief psychomotor vigilance test (PVT-B). Its median reaction time
            and lapses over 355 ms track sleep loss, and the test was built for use in flight.
          </li>
          <li>
            <strong>Resting heart rate and blood pressure</strong>, for the cardiovascular changes that follow fluid shift and reduced load.
          </li>
          <li>
            <strong>Temperature and immune symptoms</strong>, including rashes and lip blisters. Epstein-Barr, varicella-zoster and cytomegalovirus reactivate more
            often on long ISS missions, and skin rashes were the most common clinical event in 46 long-duration ISS missions.
          </li>
          <li>
            <strong>Exercise and body mass</strong>, the levers crew control against bone and muscle loss, and back pain, which is common early in flight.
          </li>
          <li>
            <strong>Headache and near vision</strong>, early signs linked to fluid shift and cabin carbon dioxide.
          </li>
          <li>
            <strong>Radiation dose</strong> from the personal dosimeter, shown against the 600 mSv career limit in NASA’s crew health standard.
          </li>
        </ul>

        <h2>Analysis of GLDS-53</h2>
        <p>{STUDY.methodsLine}</p>

        <h2>What Tether does not do</h2>
        <ul>
          <li>It does not diagnose. A flag means a value moved, not that something is wrong.</li>
          <li>It does not replace the flight surgeon. Every Act card says when to bring them in.</li>
          <li>It does not send data anywhere. Everything stays on the device until the crew member exports it.</li>
          <li>It does not use machine learning. Every flag can be traced to the rule above and checked by hand.</li>
        </ul>

        <h2>Limits of the GeneLab data</h2>
        <p>{STUDY.limitsLine}</p>

        <h2>References</h2>
        <ol className="refs">
          <li>
            Barrila J, Ott CM, LeBlanc C, Mehta SK, Crabbé A, Stafford P, Pierson DL, Nickerson CA. Spaceflight modulates gene expression in the whole blood of
            astronauts. <em>npj Microgravity</em> 2, 16039 (2016).{' '}
            <a href="https://doi.org/10.1038/npjmgrav.2016.39" target="_blank" rel="noreferrer">
              doi:10.1038/npjmgrav.2016.39
            </a>
          </li>
          <li>
            NASA Open Science Data Repository. OSD-53 / GLDS-53, Spaceflight Modulates Gene Expression in Astronauts.{' '}
            <a href="https://doi.org/10.25966/qsf7-cr81" target="_blank" rel="noreferrer">
              doi:10.25966/qsf7-cr81
            </a>
          </li>
          {STUDY.extraRefs.map((r) => (
            <li key={r.text}>
              {r.text}{' '}
              {r.href && (
                <a href={r.href} target="_blank" rel="noreferrer">
                  {r.link}
                </a>
              )}
            </li>
          ))}
        </ol>
      </article>
    </div>
  )
}
