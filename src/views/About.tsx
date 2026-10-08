import { STUDY } from '../data/study'
import { GEO, OSD_DOI, PAPER_DOI, REPO } from '../lib/links'

export function About() {
  return (
    <div className="stack" style={{ gap: 28 }}>
      <div className="page-head">
        <div>
          <h1>About Astra</h1>
          <p>Why it was made, who made it, how it is built and where the data comes from.</p>
        </div>
      </div>

      <div className="with-aside">
        <article className="panel prose">
          <h2 style={{ marginTop: 0 }}>The project</h2>
          <p>
            Astra was made for the NASA Space Apps Challenge brief on astronaut health self-monitoring, which asks for software that gathers health indicators
            and lets astronauts evaluate and act on the status of their health during long-duration missions.
          </p>
          <p>
            It is a working web app, not a mock-up. Every screen on this site runs on the same code, and the demo uses a simulated crew member so that nothing has
            to be installed and no account is needed.
          </p>

          <h2>Who made it</h2>
          <p>Astra is a project by Md. Musfiqur Rahman Akib, Computer Science and Engineering, Chittagong Independent University, Bangladesh.</p>

          <h2>How it is built</h2>
          <ul>
            <li>The app is written in TypeScript with React and built with Vite. There is no interface library and no chart library: every chart is drawn directly in SVG.</li>
            <li>All entries are kept in the browser’s local storage. A service worker caches the app so it keeps working without a connection.</li>
            <li>The rules that decide Watch and Act are covered by automated unit tests and are written out in full on the How it works page.</li>
            <li>
              The GLDS-53 re-analysis is a Python script that uses pandas, NumPy and SciPy. It reads the original NASA files and writes the one data file this
              site displays.
            </li>
          </ul>

          <h2>Data and sources</h2>
          <p>
            The gene expression data are from the NASA Open Science Data Repository, study{' '}
            <a href={OSD_DOI} target="_blank" rel="noreferrer">
              OSD-53 / GLDS-53
            </a>
            , also deposited as{' '}
            <a href={GEO} target="_blank" rel="noreferrer">
              GEO series GSE47126
            </a>
            . The study was published by Barrila and colleagues in{' '}
            <a href={PAPER_DOI} target="_blank" rel="noreferrer">
              npj Microgravity (2016)
            </a>
            . These are public NASA open science data. Every other source used in the app is listed with its DOI on the <a href="#/method">How it works</a> page.
          </p>

          <h2>Known limits</h2>
          <p>{STUDY.limitsLine}</p>
          <p>The demo crew member is simulated and is labelled as demo data wherever it appears. Astra does not diagnose and does not replace the flight surgeon.</p>

          <h2>Code and reuse</h2>
          <p>
            The source code, the analysis script and the original input files are on{' '}
            <a href={REPO} target="_blank" rel="noreferrer">
              GitHub
            </a>
            , released under the MIT License. Corrections and suggestions are welcome as{' '}
            <a href={`${REPO}/issues`} target="_blank" rel="noreferrer">
              GitHub issues
            </a>
            .
          </p>
        </article>

        <aside className="panel flat facts" aria-label="At a glance">
          <h2 className="h3">At a glance</h2>
          <dl>
            <dt>Made for</dt>
            <dd>NASA Space Apps Challenge</dd>
            <dt>Dataset</dt>
            <dd>NASA GeneLab GLDS-53 (OSD-53)</dd>
            <dt>Made by</dt>
            <dd>Md. Musfiqur Rahman Akib</dd>
            <dt>Built with</dt>
            <dd>TypeScript, React, Vite, Python</dd>
            <dt>License</dt>
            <dd>MIT</dd>
            <dt>Source</dt>
            <dd>
              <a href={REPO} target="_blank" rel="noreferrer">
                github.com/MdMusfiqurRahmanAkib/tether
              </a>
            </dd>
          </dl>
        </aside>
      </div>
    </div>
  )
}
