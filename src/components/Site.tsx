import { useState } from 'react'
import type { Route } from '../context'
import { GEO, OSD_DOI, PAPER_DOI, REPO } from '../lib/links'
import { IconClose, IconMenu, IconMoon, IconSun, Logo } from './Icons'

const PAGES: { id: Route; label: string }[] = [
  { id: 'home', label: 'Overview' },
  { id: 'evidence', label: 'The data' },
  { id: 'method', label: 'How it works' },
  { id: 'about', label: 'About' },
]

interface HeaderProps {
  route: Route
  isDark: boolean
  onToggleTheme: () => void
  onboarded: boolean
  onDemo: () => void
}

export function SiteHeader({ route, isDark, onToggleTheme, onboarded, onDemo }: HeaderProps) {
  const [open, setOpen] = useState(false)

  const links = PAGES.map((p) => (
    <a key={p.id} href={`#/${p.id}`} aria-current={route === p.id ? 'page' : undefined} onClick={() => setOpen(false)}>
      {p.label}
    </a>
  ))

  return (
    <header className="site-head">
      <div className="wrap site-head-in">
        <a className="brand" href="#/home" style={{ padding: 0 }}>
          <Logo />
          Tether
        </a>
        <nav className="site-nav" aria-label="Site">
          {links}
        </nav>
        <div className="site-tools">
          <button className="icon-btn" onClick={onToggleTheme} aria-label={isDark ? 'Use light theme' : 'Use dark theme'}>
            {isDark ? <IconSun /> : <IconMoon />}
          </button>
          {onboarded ? (
            <a className="btn primary" href="#/status">
              Open the app
            </a>
          ) : (
            <button className="btn primary" onClick={onDemo}>
              Explore the demo
            </button>
          )}
          <button className="icon-btn menu-btn" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="site-menu" aria-label="Menu">
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="site-menu" id="site-menu" aria-label="Site">
          <div className="wrap">{links}</div>
        </nav>
      )}
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="wrap site-foot-in">
        <div className="foot-brand">
          <div className="brand" style={{ padding: 0 }}>
            <Logo size={24} />
            Tether
          </div>
          <p className="small ink2">A daily health self-check for long-duration spaceflight crews, built on NASA GeneLab study GLDS-53.</p>
        </div>

        <nav aria-label="Pages">
          <h2 className="foot-h">Site</h2>
          {PAGES.map((p) => (
            <a key={p.id} href={`#/${p.id}`}>
              {p.label}
            </a>
          ))}
        </nav>

        <nav aria-label="Data sources">
          <h2 className="foot-h">Data</h2>
          <a href={OSD_DOI}>NASA OSDR, OSD-53 / GLDS-53</a>
          <a href={PAPER_DOI}>Barrila et al., npj Microgravity (2016)</a>
          <a href={GEO}>NCBI GEO, GSE47126</a>
        </nav>

        <nav aria-label="Project">
          <h2 className="foot-h">Project</h2>
          <a href={REPO}>Source code on GitHub</a>
          <a href={`${REPO}/blob/main/LICENSE`}>MIT License</a>
          <a href={`${REPO}/issues`}>Report a problem</a>
        </nav>
      </div>

      <div className="wrap foot-legal xsmall muted">
        <p>© 2026 Md. Musfiqur Rahman Akib. Code released under the MIT License. GLDS-53 data are public NASA open science data.</p>
        <p>
          Tether is an independent project made for the NASA Space Apps Challenge. It is not endorsed by NASA, it does not diagnose, and it does not replace
          the flight surgeon.
        </p>
      </div>
    </footer>
  )
}
