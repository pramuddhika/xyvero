/* eslint-disable prettier/prettier */
import React from 'react'

type ConfigurationRecord = {
  configuration_id: number
  configuration_key: string
  configuration_value: string
}

type SettingsProps = {
  configuration: ConfigurationRecord[]
  databasePath: string
  isLoading: boolean
}

function Settings({ configuration, databasePath, isLoading }: SettingsProps): React.JSX.Element {
  return (
    <section className="content-area">
      <h2>Settings</h2>
      <p>Application settings and preferences.</p>

      <div className="db-info">
        <strong>SQLite path:</strong> <span>{databasePath || 'Loading...'}</span>
      </div>

      {isLoading ? <p>Loading configuration...</p> : null}

      {!isLoading ? (
        <div className="settings-table-wrap">
          <table className="settings-table">
            <thead>
              <tr>
                <th>configuration_id</th>
                <th>configuration_key</th>
                <th>configuration_value</th>
              </tr>
            </thead>
            <tbody>
              {configuration.map((row) => (
                <tr key={row.configuration_id}>
                  <td>{row.configuration_id}</td>
                  <td>{row.configuration_key}</td>
                  <td>{row.configuration_value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}

export default Settings
