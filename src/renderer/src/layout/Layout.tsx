/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable prettier/prettier */
import React, { useCallback, useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Transactions from '../pages/Transactions'
import Statistics from '../pages/Statistics'
import Accounts from '../pages/Accounts'
import Categories from '../pages/Categories'
import Settings from '../pages/Settings'
import About from '../pages/About'

type ConfigurationRecord = {
  configuration_id: number
  configuration_key: string
  configuration_value: string
}

function Layout(): React.JSX.Element {
  const [isNavOpen, setIsNavOpen] = useState(true)
  const [activePage, setActivePage] = useState('Transactions')
  const [configuration, setConfiguration] = useState<ConfigurationRecord[]>([])
  const [databasePath, setDatabasePath] = useState('')
  const [isConfigLoading, setIsConfigLoading] = useState(true)

  const loadConfiguration = useCallback(async (): Promise<void> => {
    try {
      const [path, rows] = await Promise.all([
        window.api.getDatabasePath(),
        window.api.listConfiguration()
      ])

      setDatabasePath(path)
      setConfiguration(rows)
    } finally {
      setIsConfigLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadConfiguration()
  }, [loadConfiguration])

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
        return (
          <Settings
            configuration={configuration}
            databasePath={databasePath}
            isLoading={isConfigLoading}
            onConfigurationChange={loadConfiguration}
          />
        )
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