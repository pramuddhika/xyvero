/* eslint-disable prettier/prettier */
import React, { useMemo, useState } from 'react'
import Select, { type StylesConfig, type Theme } from 'react-select'
import currencyCodes from 'currency-codes'

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

type SelectOption = {
  value: string
  label: string
}

const getCurrencySymbol = (currencyCode: string): string => {
  try {
    const parts = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol'
    }).formatToParts(1)

    const symbol = parts.find((part) => part.type === 'currency')?.value ?? ''
    return symbol === currencyCode ? '' : symbol
  } catch {
    return ''
  }
}

const currencyOptions: SelectOption[] = currencyCodes.data
  .map((item) => {
    const symbol = getCurrencySymbol(item.code)
    const currencyName = item.currency ?? item.code

    return {
      value: item.code,
      label: `${symbol ? `${symbol} ` : ''}${item.code} - ${currencyName}`
    }
  })
  .sort((a, b) => a.value.localeCompare(b.value))

const monthStartOptions: SelectOption[] = Array.from({ length: 30 }, (_, index) => {
  const day = String(index + 1)
  return { value: day, label: day }
})

const weekStartOptions: SelectOption[] = [
  { value: 'Monday', label: 'Monday' },
  { value: 'Sunday', label: 'Sunday' }
]

const firstViewOptions: SelectOption[] = [
  { value: 'Calendar', label: 'Calendar' },
  { value: 'Daily', label: 'Daily Transaction View' }
]

const themeOptions: SelectOption[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' }
]

const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderRadius: 10,
    borderColor: state.isFocused ? 'rgba(54, 177, 118, 0.55)' : 'rgba(255, 255, 255, 0.14)',
    boxShadow: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.06)'
  }),
  menu: (base) => ({
    ...base,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#142f3a',
    border: '1px solid rgba(255, 255, 255, 0.14)'
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? 'rgba(54, 177, 118, 0.24)'
      : state.isFocused
        ? 'rgba(54, 177, 118, 0.2)'
        : 'transparent',
    color: '#e8f4ee',
    cursor: 'pointer'
  }),
  singleValue: (base) => ({
    ...base,
    color: '#e8f4ee'
  }),
  input: (base) => ({
    ...base,
    color: '#e8f4ee'
  }),
  placeholder: (base) => ({
    ...base,
    color: 'rgba(232, 244, 238, 0.65)'
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: 'rgba(232, 244, 238, 0.8)'
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  })
}

const selectTheme = (theme: Theme): Theme => ({
  ...theme,
  colors: {
    ...theme.colors,
    primary: 'rgba(54, 177, 118, 0.95)',
    primary25: 'rgba(54, 177, 118, 0.2)',
    primary50: 'rgba(54, 177, 118, 0.3)',
    primary75: 'rgba(54, 177, 118, 0.4)'
  }
})

function Settings({ configuration, databasePath, isLoading }: SettingsProps): React.JSX.Element {
  const [currencyType, setCurrencyType] = useState<SelectOption | null>(null)
  const [monthStartDate, setMonthStartDate] = useState<SelectOption | null>(null)
  const [weekStartDate, setWeekStartDate] = useState<SelectOption | null>(null)
  const [firstView, setFirstView] = useState<SelectOption | null>(null)
  const [theme, setTheme] = useState<SelectOption | null>(null)

  const configurationMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of configuration) {
      map.set(item.configuration_key, item.configuration_value)
    }
    return map
  }, [configuration])

  const resolvedCurrency = useMemo(() => {
    const currencyValue = configurationMap.get('CURRENCY_TYPE')
    return currencyOptions.find((option) => option.value === currencyValue) ?? currencyOptions[0]
  }, [configurationMap])

  const resolvedMonthStart = useMemo(() => {
    const monthStartValue = configurationMap.get('MONTH_START_DATE')
    return (
      monthStartOptions.find((option) => option.value === monthStartValue) ?? monthStartOptions[0]
    )
  }, [configurationMap])

  const resolvedWeekStart = useMemo(() => {
    const weekStartValue = configurationMap.get('WEEK_START_DATE')
    return weekStartOptions.find((option) => option.value === weekStartValue) ?? weekStartOptions[0]
  }, [configurationMap])

  const resolvedFirstView = useMemo(() => {
    const firstViewValue = configurationMap.get('FIRST_VIEW')

    if (firstViewValue?.toLowerCase() === 'calender') {
      return firstViewOptions[0]
    }

    return firstViewOptions.find((option) => option.value === firstViewValue) ?? firstViewOptions[0]
  }, [configurationMap])

  const resolvedTheme = useMemo(() => {
    const themeValue = configurationMap.get('THEME')
    return themeOptions.find((option) => option.value === themeValue) ?? themeOptions[0]
  }, [configurationMap])

  return (
    <section className="content-area">
      <h2>Settings</h2>
      <p>Application settings and preferences.</p>

      <div className="db-info">
        <strong>SQLite path:</strong> <span>{databasePath || 'Loading...'}</span>
      </div>

      <section className="settings-card">
        <h3>General Settings</h3>

        <div className="settings-stack">
          <div className="setting-row">
            <div className="setting-description-card">
              <div className="setting-header">
                <h4>Currency Type</h4>
                <div className="setting-select">
                  <Select
                    inputId="currencyType"
                    options={currencyOptions}
                    value={currencyType ?? resolvedCurrency}
                    onChange={(selected) => setCurrencyType(selected)}
                    styles={selectStyles}
                    theme={selectTheme}
                    isSearchable
                    placeholder="Select currency"
                  />
                </div>
              </div>

              <p>
                Choose how money values are shown across the app. Example: <strong>$ USD</strong>.
              </p>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-description-card">
              <div className="setting-header">
                <h4>Account Month Start Date</h4>
                <div className="setting-select">
                  <Select
                    inputId="monthStartDate"
                    options={monthStartOptions}
                    value={monthStartDate ?? resolvedMonthStart}
                    onChange={(selected) => setMonthStartDate(selected)}
                    styles={selectStyles}
                    theme={selectTheme}
                    isSearchable={false}
                    placeholder="Select day"
                  />
                </div>
              </div>

              <p>Set the day that starts your monthly cycle, budgets, and summaries.</p>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-description-card">
              <div className="setting-header">
                <h4>Week Start Date</h4>
                <div className="setting-select">
                  <Select
                    inputId="weekStartDate"
                    options={weekStartOptions}
                    value={weekStartDate ?? resolvedWeekStart}
                    onChange={(selected) => setWeekStartDate(selected)}
                    styles={selectStyles}
                    theme={selectTheme}
                    isSearchable={false}
                    placeholder="Select day"
                  />
                </div>
              </div>

              <p>Choose whether weeks start on Monday or Sunday in the app.</p>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-description-card">
              <div className="setting-header">
                <h4>First View</h4>
                <div className="setting-select">
                  <Select
                    inputId="firstView"
                    options={firstViewOptions}
                    value={firstView ?? resolvedFirstView}
                    onChange={(selected) => setFirstView(selected)}
                    styles={selectStyles}
                    theme={selectTheme}
                    isSearchable={false}
                    placeholder="Select view"
                  />
                </div>
              </div>

              <p>Choose which transactions view opens first when the app starts.</p>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-description-card">
              <div className="setting-header">
                <h4>Theme</h4>
                <div className="setting-select">
                  <Select
                    inputId="theme"
                    options={themeOptions}
                    value={theme ?? resolvedTheme}
                    onChange={(selected) => setTheme(selected)}
                    styles={selectStyles}
                    theme={selectTheme}
                    isSearchable={false}
                    placeholder="Select theme"
                  />
                </div>
              </div>

              <p>Switch between the dark and light app themes.</p>
            </div>
          </div>
        </div>
      </section>

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
