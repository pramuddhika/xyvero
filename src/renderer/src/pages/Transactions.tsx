/* eslint-disable prettier/prettier */
import React from 'react'
import Versions from '../components/Versions'

function Transactions(): React.JSX.Element {
  return (
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
