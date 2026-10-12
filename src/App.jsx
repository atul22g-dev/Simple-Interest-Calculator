import { useEffect, useState } from 'react'
import './App.css'
import InterestCalculator from './components/InterestCalculator'

const DARK_BG = '#0f1320'
const LIGHT_BG = '#f7f7fb'

function readInitialTheme() {
  if (typeof document !== 'undefined' && document.documentElement.dataset.theme) {
    return document.documentElement.dataset.theme
  }
  return 'dark'
}

function App() {
  const [theme, setTheme] = useState(readInitialTheme)

  // Apply the theme to <html> and keep the browser chrome color in sync.
  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      root.dataset.theme = theme
      const meta = document.querySelector('meta[name="theme-color"]')
      if (meta) meta.setAttribute('content', theme === 'light' ? LIGHT_BG : DARK_BG)
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (document.startViewTransition && !prefersReduced) {
      document.startViewTransition(apply)
    } else {
      apply()
    }

    try {
      localStorage.setItem('theme', theme)
    } catch {
      /* storage unavailable — theme simply won't persist */
    }
  }, [theme])

  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">
            <svg viewBox="0 0 64 64" role="img" aria-label="Interest Calculator logo">
              <defs>
                <linearGradient id="brand-gradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--brand)" />
                  <stop offset="100%" stopColor="var(--brand-strong)" />
                </linearGradient>
              </defs>
              <rect width="64" height="64" fill="url(#brand-gradient)" />
              <g
                stroke="var(--on-brand)"
                strokeWidth="5.5"
                strokeLinecap="round"
                fill="none"
              >
                <line x1="46" y1="14" x2="18" y2="50" />
                <circle cx="21" cy="21" r="6.5" />
                <circle cx="43" cy="43" r="6.5" />
              </g>
            </svg>
          </span>
          <div className="brand-text">
            <h1>Interest Calculator</h1>
            <span className="brand-sub">Tiered simple & compound returns</span>
          </div>
        </div>

        <button
          type="button"
          className="theme-toggle"
          onClick={() => setTheme(nextTheme)}
          aria-label={`Switch to ${nextTheme} theme`}
          title={`Switch to ${nextTheme} theme`}
        >
          <svg
            className="icon-sun"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.1 5.1l1.6 1.6M17.3 17.3l1.6 1.6M18.9 5.1l-1.6 1.6M6.7 17.3l-1.6 1.6" />
          </svg>
          <svg
            className="icon-moon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20.5 14.4A8.7 8.7 0 0 1 9.6 3.5a8.7 8.7 0 1 0 10.9 10.9Z" />
          </svg>
        </button>
      </header>

      <main>
        <InterestCalculator />
      </main>

      <footer className="app-footer">
        <p>Plan deposits across custom rate slabs with Indian Lakh / Crore formatting.</p>
        <ul className="tech-chips">
          <li>React 19</li>
          <li>Vite 6</li>
          <li>CSS Layers</li>
          <li>OKLCH Color</li>
          <li>View Transitions</li>
        </ul>
      </footer>
    </div>
  )
}

export default App
