import { useEffect, useMemo, useState } from 'react'
import { Ctx, type AppCtx, type Route } from './context'
import { useStore, todayISO, flightDay } from './lib/store'
import { readAll, overall } from './lib/baseline'
import { IconAct, IconCheckin, IconEvidence, IconMethod, IconMoon, IconSettings, IconStatus, IconSun, Logo } from './components/Icons'
import { Status } from './views/Status'
import { CheckIn } from './views/CheckIn'
import { Act } from './views/Act'
import { Evidence } from './views/Evidence'
import { Method } from './views/Method'
import { Settings } from './views/Settings'
import { Welcome } from './views/Welcome'

const ROUTES: Route[] = ['about', 'status', 'checkin', 'act', 'evidence', 'method', 'settings']

function useRoute(): [Route, (r: Route) => void] {
  const parse = () => {
    const h = location.hash.replace(/^#\/?/, '').split('?')[0] as Route
    return ROUTES.includes(h) ? h : 'status'
  }
  const [route, set] = useState<Route>(parse)
  useEffect(() => {
    const on = () => {
      set(parse())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return [route, (r) => (location.hash = `/${r}`)]
}

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(() => {
    try {
      return (localStorage.getItem('tether.theme') as 'light' | 'dark' | null) ?? null
    } catch {
      return null
    }
  })
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme
    else delete document.documentElement.dataset.theme
    try {
      if (theme) localStorage.setItem('tether.theme', theme)
      else localStorage.removeItem('tether.theme')
    } catch {
      /* ignore */
    }
  }, [theme])
  const isDark = theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
  return { isDark, toggle: () => setTheme(isDark ? 'light' : 'dark') }
}

const NAV: { id: Route; label: string; Icon: typeof IconStatus; tab?: boolean }[] = [
  { id: 'status', label: 'Status', Icon: IconStatus, tab: true },
  { id: 'checkin', label: 'Check in', Icon: IconCheckin, tab: true },
  { id: 'act', label: 'Act', Icon: IconAct, tab: true },
  { id: 'evidence', label: 'Evidence', Icon: IconEvidence, tab: true },
  { id: 'method', label: 'Method', Icon: IconMethod },
  { id: 'settings', label: 'Settings', Icon: IconSettings, tab: true },
]

export default function App() {
  const store = useStore()
  const [route, go] = useRoute()
  const [toastMsg, setToast] = useState<string | null>(null)
  const { isDark, toggle } = useTheme()
  const today = todayISO()

  useEffect(() => {
    if (!toastMsg) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toastMsg])

  const actCount = useMemo(
    () => readAll(store.state.entries, store.state.profile, today).filter((r) => r.level === 'act').length,
    [store.state, today],
  )
  const level = useMemo(() => overall(readAll(store.state.entries, store.state.profile, today)), [store.state, today])
  const fd = flightDay(today, store.state.profile)

  const ctx: AppCtx = { ...store, today, go, toast: setToast }

  useEffect(() => {
    const names: Record<Route, string> = {
      about: 'Overview',
      status: 'Status',
      checkin: 'Check in',
      act: 'Act',
      evidence: 'Evidence',
      method: 'Method',
      settings: 'Settings',
    }
    document.title = store.state.onboarded || route === 'evidence' || route === 'method' ?`${names[route]} | Tether` : 'Tether'
  }, [route, store.state.onboarded])

  if (!store.state.onboarded && (route === 'evidence' || route === 'method')) {
    // the analysis and the method are open to read without setting anything up
    const Page = route === 'evidence' ? Evidence : Method
    return (
      <Ctx.Provider value={ctx}>
        <div className="limb" />
        <header className="public-top">
          <a className="brand" href="#/" style={{ padding: 0 }}>
            <Logo />
            Tether
          </a>
          <nav className="land-links" aria-label="Project">
            <a href="#/">Overview</a>
            <a href="#/evidence" aria-current={route === 'evidence' ? 'page' : undefined}>
              The data
            </a>
            <a href="#/method" aria-current={route === 'method' ? 'page' : undefined}>
              Method
            </a>
          </nav>
        </header>
        <main className="main public-main">
          <Page />
        </main>
      </Ctx.Provider>
    )
  }

  if (!store.state.onboarded || route === 'about') {
    return (
      <Ctx.Provider value={ctx}>
        <div className="limb" />
        <Welcome />
        {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
      </Ctx.Provider>
    )
  }

  const View = { about: Welcome, status: Status, checkin: CheckIn, act: Act, evidence: Evidence, method: Method, settings: Settings }[route]

  return (
    <Ctx.Provider value={ctx}>
      <div className="limb" />
      <a
        className="sr-only"
        href="#main"
        onClick={(e) => {
          // a plain #main link would be read as a route by the hash router
          e.preventDefault()
          document.getElementById('main')?.focus()
        }}
      >
        Skip to content
      </a>
      <div className="shell">
        <aside className="rail">
          <a className="brand" href="#/status">
            <Logo />
            Tether
          </a>
          <nav className="nav" aria-label="Main">
            {NAV.map(({ id, label, Icon }) => (
              <a key={id} href={`#/${id}`} aria-current={route === id ? 'page' : undefined}>
                <Icon />
                {label}
                {id === 'act' && actCount > 0 && <span className="badge chip act">{actCount}</span>}
              </a>
            ))}
          </nav>
          <div className="rail-foot">
            <a className="small ink2" href="#/about">
              Project overview
            </a>
            {store.state.demo && <span className="demo-flag">Demo data, simulated</span>}
            <div className="small ink2">
              {store.state.profile.callsign || 'Crew member'}
              <br />
              <span className="muted num">{fd ? `Flight day ${fd}` : 'Before flight'}</span>
            </div>
            <button className="btn ghost" onClick={toggle} aria-label={isDark ? 'Use light theme' : 'Use dark theme'} style={{ justifySelf: 'start', paddingLeft: 8 }}>
              {isDark ? <IconSun /> : <IconMoon />}
              {isDark ? 'Light' : 'Dark'}
            </button>
          </div>
        </aside>

        <header className="topbar">
          <a className="brand" href="#/status" style={{ padding: 0 }}>
            <Logo size={22} />
            Tether
          </a>
          <div className="row" style={{ gap: 6 }}>
            {store.state.demo && <span className="demo-flag">Demo</span>}
            <span className={`chip ${level === 'none' ? 'none' : level}`}>{fd ? `FD ${fd}` : 'Pre'}</span>
            <button className="btn ghost" onClick={toggle} aria-label={isDark ? 'Use light theme' : 'Use dark theme'} style={{ width: 40, padding: 0 }}>
              {isDark ? <IconSun /> : <IconMoon />}
            </button>
          </div>
        </header>

        <main className="main" id="main" tabIndex={-1} style={{ outline: 'none' }}>
          <View />
        </main>

        <nav className="tabbar" aria-label="Main">
          {NAV.filter((n) => n.tab).map(({ id, label, Icon }) => (
            <a key={id} href={`#/${id}`} aria-current={route === id ? 'page' : undefined}>
              <Icon />
              {label}
              {id === 'act' && actCount > 0 && <span className="dot-badge" />}
            </a>
          ))}
        </nav>
      </div>
      {toastMsg && (
        <div className="toast" role="status">
          {toastMsg}
        </div>
      )}
    </Ctx.Provider>
  )
}
