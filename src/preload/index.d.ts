/* eslint-disable prettier/prettier */
import { ElectronAPI } from '@electron-toolkit/preload'

type ConfigurationRecord = {
  configuration_id: number
  configuration_key: string
  configuration_value: string
}

interface AppApi {
  getDatabasePath: () => Promise<string>
  listConfiguration: () => Promise<ConfigurationRecord[]>
  setConfigurationValue: (configurationKey: string, configurationValue: string) => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppApi
  }
}

export {}
