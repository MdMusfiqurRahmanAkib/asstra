import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './components.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
    // The first page load happens before the worker is in control, so hand it
    // the files that were just fetched. One online visit is then enough.
    navigator.serviceWorker.ready.then((reg) => {
      const urls = performance.getEntriesByType('resource').map((r) => r.name)
      reg.active?.postMessage({ cache: urls })
    })
  })
}
