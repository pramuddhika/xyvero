/* eslint-disable prettier/prettier */
import React from 'react'
import logoDark from '../assets/logo.jpeg'
import { JSX } from 'react/jsx-runtime'

type SidebarProps = {
  isOpen: boolean
  onToggle: () => void
  onNavigate?: (page: string) => void
  active?: string
  theme: 'dark' | 'light'
}

const navItems = [
  { label: 'Transactions', description: 'View and manage your transactions' },
  { label: 'Statistics', description: 'View your financial insights' },
  { label: 'Accounts', description: 'Manage your accounts' },
  { label: 'Categories', description: 'Manage your expense categories' },
  { label: 'Settings', description: 'Configure your preferences' },
  { label: 'About', description: 'Learn more about Xyvero' }
]

const Icons: Record<string, JSX.Element> = {
  Transactions: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Statistics: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="10" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.6"/>
      <rect x="9" y="6" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="1.6"/>
      <rect x="15" y="2" width="4" height="18" rx="1" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  ),
  Accounts: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M4 20c1.5-4 7-6 12-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  Categories: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 12l-9 9a2 2 0 0 1-2.8 0L3 14a2 2 0 0 1 0-2.8L12 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="7" cy="7" r="1.5" fill="currentColor"/>
    </svg>
  ),
  Settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M19.4 15a1.7 1.7 0 0 0 .33 1.9l.06.06a1 1 0 0 1-1.42 1.42l-.06-.06a1.7 1.7 0 0 0-1.9-.33 1.7 1.7 0 0 0-1 1.5V21a1 1 0 0 1-2 0v-.16a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.33l-.06.06A1 1 0 0 1 6.3 18.95l.06-.06a1.7 1.7 0 0 0 .33-1.9 1.7 1.7 0 0 0-1.5-1H4a1 1 0 0 1 0-2h.16a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.33-1.9L5.4 6.3A1 1 0 0 1 6.82 4.9l.06.06a1.7 1.7 0 0 0 1.9.33h.01a1.7 1.7 0 0 0 1-1.5V4a1 1 0 0 1 2 0v.16c.12.6.52 1.12 1 1.5.6.4 1.4.44 1.9-.33l.06-.06A1 1 0 0 1 17.7 5.05l-.06.06a1.7 1.7 0 0 0-.33 1.9c.34.6 1 1 1.5 1H20a1 1 0 0 1 0 2h-.16c-.6.12-1.12.52-1.5 1-.4.6-.44 1.4.33 1.9z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  About: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M12 8v.01M11 12h1v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function Sidebar({ isOpen, onToggle, onNavigate, active, theme }: SidebarProps): React.JSX.Element {
  const logo =
    theme === 'light'
      ? new URL('../../../../resources/icon_light.png', import.meta.url).href
      : logoDark

  return (
    <aside className={`side-nav ${isOpen ? 'open' : 'closed'}`}>
      {isOpen ? (
        <div className="side-nav-top">
          <div className="brand-lockup">
            <button
              type="button"
              className="nav-collapse nav-collapse-inline"
              onClick={onToggle}
              aria-label="Collapse navigation bar"
            >
              <span aria-hidden="true">◀</span>
            </button>

            <img alt="Xyvero logo" className="side-nav-logo" src={logo} />
            <div className="brand-copy">
              <div>
                <h1 className="brand-name">Xyvero</h1>
                <p className="brand-subtitle">Manage money, your way</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isOpen ? null : (
        <button
          type="button"
          className="collapsed-logo-button"
          onClick={onToggle}
          aria-label="Expand navigation bar"
        >
          <img alt="Xyvero logo" className="side-nav-logo collapsed-logo" src={logo} />
        </button>
      )}

      <nav className="side-nav-links" aria-label="Primary">
        {navItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`nav-item ${active === item.label ? 'active' : ''}`}
            title={item.description}
            onClick={() => onNavigate?.(item.label)}
          >
            <span className="nav-item-icon" aria-hidden="true">
              {Icons[item.label] ?? null}
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
          <div className="nav-version">Version 1.0.0</div>
        </div>
      ) : null}
    </aside>
  )
}

export default Sidebar