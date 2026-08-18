/* eslint-disable prettier/prettier */
import { ElectronAPI } from '@electron-toolkit/preload'

type ConfigurationRecord = {
  configuration_id: number
  configuration_key: string
  configuration_value: string
}

type AccountTypeRecord = {
  account_type_id: number
  account_type: string
  account_type_name: string
}

interface AppApi {
  getDatabasePath: () => Promise<string>
  listConfiguration: () => Promise<ConfigurationRecord[]>
  getConfigurationValue: (configurationKey: string) => Promise<ConfigurationRecord | undefined>
  setConfigurationValue: (configurationKey: string, configurationValue: string) => Promise<void>
  listAccountTypes: () => Promise<AccountTypeRecord[]>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppApi
  }
}

export {}
