import { useState, type ReactNode } from 'react'
import Sidebar from './Sidebar'

type LayoutProps = {
  children: ReactNode
}

function Layout({ children }: LayoutProps): React.JSX.Element {
  const [isNavOpen, setIsNavOpen] = useState(true)

  return (
    <div className="app-shell">
      <Sidebar isOpen={isNavOpen} onToggle={() => setIsNavOpen((prev) => !prev)} />

      <main className="main-panel">
        <header className="main-header">
          <div className="header-copy">
            <span className="header-kicker">Overview</span>
            <span className="header-title">Xyvero Workspace</span>
          </div>
          <div className="header-status" aria-label="Application status">
            Ready
          </div>
        </header>

        {children}
      </main>
    </div>
  )
}

export default Layout