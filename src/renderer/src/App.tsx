import { useState } from 'react'
import Versions from './components/Versions'
import logo from './assets/logo.jpeg'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
  const [isNavOpen, setIsNavOpen] = useState(true)

  return (
    <div className="app-shell">
      <aside className={`side-nav ${isNavOpen ? 'open' : 'closed'}`}>
        <div className="side-nav-top">
          <img alt="Xyvero logo" className="side-nav-logo" src={logo} />
          {isNavOpen ? <h1 className="brand-name">Xyvero</h1> : null}
        </div>

        {isNavOpen ? (
          <nav className="side-nav-links" aria-label="Primary">
            <button type="button" className="nav-item">
              Dashboard
            </button>
            <button type="button" className="nav-item">
              Projects
            </button>
            <button type="button" className="nav-item">
              Settings
            </button>
          </nav>
        ) : null}
      </aside>

      <main className="main-panel">
        <header className="main-header">
          <button
            className="nav-toggle"
            type="button"
            onClick={() => setIsNavOpen((prev) => !prev)}
            aria-label={isNavOpen ? 'Hide side navigation' : 'Open side navigation'}
          >
            {isNavOpen ? 'Hide Menu' : 'Open Menu'}
          </button>
          <span className="header-title">Xyvero Workspace</span>
        </header>

        <section className="content-area">
          <p className="tip">
            Use <code>F12</code> for Developer Tools
          </p>
          <div className="actions">
            <div className="action">
              <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
                Documentation
              </a>
            </div>
            <div className="action">
              <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
                Send IPC
              </a>
            </div>
          </div>
          <Versions></Versions>
        </section>
      </main>
    </div>
  )
}

export default App
