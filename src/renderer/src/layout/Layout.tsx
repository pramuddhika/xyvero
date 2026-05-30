/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable prettier/prettier */
import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Transactions from '../pages/Transactions'
import Statistics from '../pages/Statistics'
import Accounts from '../pages/Accounts'
import Categories from '../pages/Categories'
import Settings from '../pages/Settings'
import About from '../pages/About'

function Layout(): React.JSX.Element {
  const [isNavOpen, setIsNavOpen] = useState(true)
  const [activePage, setActivePage] = useState('Transactions')

  const renderPage = () => {
    switch (activePage) {
      case 'Transactions':
        return <Transactions />
      case 'Statistics':
        return <Statistics />
      case 'Accounts':
        return <Accounts />
      case 'Categories':
        return <Categories />
      case 'Settings':
        return <Settings />
      case 'About':
        return <About />
      default:
        return <Transactions />
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={isNavOpen}
        onToggle={() => setIsNavOpen((prev) => !prev)}
        onNavigate={(p) => setActivePage(p)}
        active={activePage}
      />

      <main className="main-panel">
        {renderPage()}
      </main>
    </div>
  )
}

export default Layout