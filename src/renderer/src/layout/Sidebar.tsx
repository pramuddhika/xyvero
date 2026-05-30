import logo from '../assets/logo.jpeg'

type SidebarProps = {
  isOpen: boolean
  onToggle: () => void
}

const navItems = [
  {
    label: 'Dashboard',
    description: 'Overview and recent activity',
    icon: 'D'
  },
  {
    label: 'Projects',
    description: 'Browse and manage workspaces',
    icon: 'P'
  },
  {
    label: 'Settings',
    description: 'Configure your app',
    icon: 'S'
  }
]

function Sidebar({ isOpen, onToggle }: SidebarProps): React.JSX.Element {
  return (
    <aside className={`side-nav ${isOpen ? 'open' : 'closed'}`}>
      {isOpen ? (
        <div className="side-nav-top">
          <div className="brand-lockup">
            <img alt="Xyvero logo" className="side-nav-logo" src={logo} />
            <div className="brand-copy">
              <div>
                <h1 className="brand-name">Xyvero</h1>
                <p className="brand-subtitle">Workspace hub</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="nav-collapse nav-collapse-inline"
            onClick={onToggle}
            aria-label="Collapse navigation bar"
          >
            <span aria-hidden="true">◀</span>
          </button>
        </div>
      ) : null}

      {isOpen ? null : (
        <button
          type="button"
          className="collapsed-logo-button"
          onClick={onToggle}
          aria-label="Expand navigation bar"
        >
          <img alt="Xyvera logo" className="side-nav-logo collapsed-logo" src={logo} />
        </button>
      )}

      <nav className="side-nav-links" aria-label="Primary">
        {navItems.map((item) => (
          <button key={item.label} type="button" className="nav-item" title={item.description}>
            <span className="nav-item-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="nav-item-copy">
              <span className="nav-item-label">{item.label}</span>
              {isOpen ? <span className="nav-item-description">{item.description}</span> : null}
            </span>
          </button>
        ))}
      </nav>

      {isOpen ? (
        <div className="side-nav-footer">
          <div className="nav-help-card">
            <span className="nav-help-kicker">Tip</span>
            <p>Use the arrow in the top corner to collapse the panel and keep more space for the main canvas.</p>
          </div>
        </div>
      ) : null}
    </aside>
  )
}

export default Sidebar