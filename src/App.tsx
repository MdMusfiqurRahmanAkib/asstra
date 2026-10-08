import { useEffect, useMemo, useState } from 'react'
import { Ctx, type AppCtx, type Route } from './context'
import { useStore, todayISO, flightDay } from './lib/store'
import { readAll, overall } from './lib/baseline'
import { demoState } from './lib/demo'
import { IconAct, IconCheckin, IconMoon, IconSettings, IconStatus, IconSun, Logo } from './components/Icons'
import { SiteFooter, SiteHeader } from './components/Site'
import { Home } from './views/Home'
import { About } from './views/About'
import { Evidence } from './views/Evidence'
import { Method } from './views/Method'
import { Status } from './views/Status'
import { CheckIn } from './views/CheckIn'
import { Act } from './views/Act'
import { Settings } from './views/Settings'

// Site pages are open to everyone. App pages need a profile or the demo.
const SITE: Route[] = ['home', 'evidence', 'method', 'about']
const APP: Route[] = ['status', 'checkin', 'act', 'settings']

const TITLES: Record<Route, string> = {
  home: 'Astra: a daily health self-check for astronauts',
  evidence: 'The data | Astra',
  method: 'How it works | Astra',
  about: 'About | Astra',
  status: 'Status | Astra',
  checkin: 'Check in | Astra',
  act: 'Act | Astra',
  settings: 'Settings | Astra',
}

function useRoute(): [Route, (r: Route) => void] {
  const parse = () => {
    const h = location.hash.replace(/^#\/?/, '').split('?')[0] as Route
    return SITE.includes(h) || APP.includes(h) ? h : 'home'
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
      return (localStorage.getItem('astra.theme') as 'light' | 'dark' | null) ?? null
    } catch {
      return null
    }
  })
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme
    else delete document.documentElement.dataset.theme
    try {
      if (theme) localStorage.setItem('astra.theme', theme)
      else localStorage.removeItem('astra.theme')
    } catch {
      /* ignore */
    }
  }, [theme])
  const isDark = theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
  return { isDark, toggle: () => setTheme(isDark ? 'light' : 'dark') }
}

const NAV: { id: Route; label: string; Icon: typeof IconStatus }[] = [
  { id: 'status', label: 'Status', Icon: IconStatus },
  { id: 'checkin', label: 'Check in', Icon: IconCheckin },
  { id: 'act', label: 'Act', Icon: IconAct },
  { id: 'settings', label: 'Settings', Icon: IconSettings },
]

const APP_VIEWS = { status: Status, checkin: CheckIn, act: Act, settings: Settings }

export default function App() {
  const store = useStore()
  const [route, go] = useRoute()
  const [toastMsg, setToast] = useState<string | null>(null)
  const { isDark, toggle } = useTheme()
  const today = todayISO()
  const { onboarded } = store.state

  // without a profile there is nothing to show in the app, so its pages fall back to the overview
  const page: Route = APP.includes(route) && !onboarded ? 'home' : route

  useEffect(() => {
    if (!toastMsg) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toastMsg])

  useEffect(() => {
    document.title = TITLES[page]
  }, [page])

  const actCount = useMemo(
    () => readAll(store.state.entries, store.state.profile, today).filter((r) => r.level === 'act').length,
    [store.state, today],
  )
  const level = useMemo(() => overall(readAll(store.state.entries, store.state.profile, today)), [store.state, today])
  const fd = flightDay(today, store.state.profile)

  const ctx: AppCtx = { ...store, today, go, toast: setToast }

  const openDemo = () => {
    store.setState(demoState())
    go('status')
  }

  const skip = (
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
  )

  const toast = toastMsg && (
    <div className="toast" role="status">
      {toastMsg}
    </div>
  )

  if (SITE.includes(page)) {
    return (
      <Ctx.Provider value={ctx}>
        <div className="limb" />
        {skip}
        <div className="site">
          <SiteHeader route={page} isDark={isDark} onToggleTheme={toggle} onboarded={onboarded} onDemo={openDemo} />
          <main className="site-main" id="main" tabIndex={-1}>
            {page === 'home' ? (
              <Home onDemo={openDemo} />
            ) : (
              <div className="wrap site-page">{page === 'evidence' ? <Evidence /> : page === 'method' ? <Method /> : <About />}</div>
            )}
          </main>
          <SiteFooter />
        </div>
        {toast}
      </Ctx.Provider>
    )
  }

  const View = APP_VIEWS[page as keyof typeof APP_VIEWS]

  return (
    <Ctx.Provider value={ctx}>
      <div className="limb" />
      {skip}
      <div className="shell">
        <aside className="rail">
          <a className="brand" href="#/home">
            <Logo />
            Astra
          </a>
          <nav className="nav" aria-label="App">
            {NAV.map(({ id, label, Icon }) => (
              <a key={id} href={`#/${id}`} aria-current={page === id ? 'page' : undefined}>
                <Icon />
                {label}
                {id === 'act' && actCount > 0 && <span className="badge chip act">{actCount}</span>}
              </a>
            ))}
          </nav>
          <nav className="nav-sub" aria-label="About the project">
            <span className="nav-sub-title">About the project</span>
            <a href="#/home">Overview</a>
            <a href="#/evidence">The data</a>
            <a href="#/method">How it works</a>
          </nav>
          <div className="rail-foot">
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
          <a className="brand" href="#/home" style={{ padding: 0 }}>
            <Logo size={22} />
            Astra
          </a>
          <div className="row" style={{ gap: 6 }}>
            {store.state.demo && <span className="demo-flag">Demo</span>}
            <span className={`chip ${level === 'none' ? 'none' : level}`}>{fd ? `FD ${fd}` : 'Pre'}</span>
            <button className="btn ghost" onClick={toggle} aria-label={isDark ? 'Use light theme' : 'Use dark theme'} style={{ width: 40, padding: 0 }}>
              {isDark ? <IconSun /> : <IconMoon />}
            </button>
          </div>
        </header>

        <main className="main" id="main" tabIndex={-1}>
          <View />
        </main>

        <nav className="tabbar" aria-label="App">
          {NAV.map(({ id, label, Icon }) => (
            <a key={id} href={`#/${id}`} aria-current={page === id ? 'page' : undefined}>
              <Icon />
              {label}
              {id === 'act' && actCount > 0 && <span className="dot-badge" />}
            </a>
          ))}
        </nav>
      </div>
      {toast}
    </Ctx.Provider>
  )
}
