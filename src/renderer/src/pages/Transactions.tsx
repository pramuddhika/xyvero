/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from 'react'
import Versions from '../components/Versions'

function Transactions(): React.JSX.Element {
  const [dbPath, setDbPath] = useState('')

  useEffect(() => {
    const load = async (): Promise<void> => {
      const path = await window.api.getDatabasePath()
      setDbPath(path)
    }

    void load()
  }, [])

  return (
    <section className="content-area">
      <div className="db-info">
        <strong>SQLite file:</strong> <span>{dbPath || 'Loading...'}</span>
      </div>

      <div className="actions">
        <div className="action">
          <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={() => window.electron.ipcRenderer.send('ping')}>
            Send IPC
          </a>
        </div>
      </div>
      <Versions />
    </section>
  )
}

export default Transactions
