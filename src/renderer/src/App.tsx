import Layout from './layout/Layout'
import Versions from './components/Versions'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <Layout>
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
    </Layout>
  )
}

export default App
