/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable prettier/prettier */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Sidebar from './Sidebar'
import Transactions from '../pages/Transactions'
import Statistics from '../pages/Statistics'
import Accounts from '../pages/Accounts'
import Categories from '../pages/Categories'
import Settings from '../pages/Settings'
import About from '../pages/About'
import UpdateToast from '../components/UpdateToast'
import type { ConfigurationRecord } from '../types'

function Layout(): React.JSX.Element {
  const [isNavOpen, setIsNavOpen] = useState(true)
  const [activePage, setActivePage] = useState('Transactions')
  const [configuration, setConfiguration] = useState<ConfigurationRecord[]>([])
  const [databasePath, setDatabasePath] = useState('')
  const [isConfigLoading, setIsConfigLoading] = useState(true)

  const handleConfigurationUpdated = useCallback(
    (configurationKey: string, configurationValue: string) => {
      setConfiguration((currentConfiguration) => {
        const nextConfiguration = currentConfiguration.map((item) => {
          if (item.configuration_key !== configurationKey) {
            return item
          }

          return {
            ...item,
            configuration_value: configurationValue
          }
        })

        return nextConfiguration
      })
    },
    []
  )

  const themeMode = useMemo(() => {
    const themeValue = configuration.find((item) => item.configuration_key === 'THEME')
    return themeValue?.configuration_value === 'light' ? 'light' : 'dark'
  }, [configuration])

  useEffect(() => {
    document.body.dataset.theme = themeMode
    return () => {
      delete document.body.dataset.theme
    }
  }, [themeMode])

  const loadConfiguration = useCallback(async (): Promise<void> => {
    if (!window.api?.getDatabasePath || !window.api?.listConfiguration) {
      setIsConfigLoading(false)
      return
    }
    try {
      const [path, rows] = await Promise.all([
        window.api.getDatabasePath(),
        window.api.listConfiguration()
      ])

      setDatabasePath(path)
      setConfiguration(rows)
    } catch (error) {
      console.error('Failed to load configuration:', error)
    } finally {
      setIsConfigLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadConfiguration()
  }, [loadConfiguration])

  useEffect(() => {
    if (activePage === 'Settings') {
      void loadConfiguration()
    }
  }, [activePage, loadConfiguration])

  const renderPage = () => {
    switch (activePage) {
      case 'Transactions': {
        const weekStartValue = configuration.find(
          (item) => item.configuration_key === 'WEEK_START_DATE'
        )
        const resolvedWeekStart = weekStartValue?.configuration_value ?? 'Sunday'
        return <Transactions theme={themeMode} weekStart={resolvedWeekStart} />
      }
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
            onConfigurationUpdated={handleConfigurationUpdated}
          />
        )
      case 'About':
        return <About />
      default: {
        const weekStartValue = configuration.find(
          (item) => item.configuration_key === 'WEEK_START_DATE'
        )
        const resolvedWeekStart = weekStartValue?.configuration_value ?? 'Sunday'
        return <Transactions theme={themeMode} weekStart={resolvedWeekStart} />
      }
    }
  }

  return (
    <div className={`app-shell theme-${themeMode}`}>
      <Sidebar
        isOpen={isNavOpen}
        onToggle={() => setIsNavOpen((prev) => !prev)}
        onNavigate={(p) => setActivePage(p)}
        active={activePage}
        theme={themeMode}
      />

      <main className="main-panel">{renderPage()}</main>
      <UpdateToast />
    </div>
  )
}

export default Layout
