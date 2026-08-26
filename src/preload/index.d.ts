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

type CategoryTypeRecord = {
  category_id: number
  category_type: string
  category_name: string
}

type CategoryRecord = {
  category_id: number
  category_name: string
  category_amount: number
  category_group_id: number
  category_icon: string
  category_colour: string
}

type AccountRecord = {
  account_id: number
  account_name: string
  account_amount: number
  account_type_id: number
  account_color: string
  account_icon: string
}

interface AppApi {
  getDatabasePath: () => Promise<string>
  listConfiguration: () => Promise<ConfigurationRecord[]>
  getConfigurationValue: (configurationKey: string) => Promise<ConfigurationRecord | undefined>
  setConfigurationValue: (configurationKey: string, configurationValue: string) => Promise<void>
  listAccountTypes: () => Promise<AccountTypeRecord[]>
  listAccounts: () => Promise<AccountRecord[]>
  addAccount: (
    accountName: string,
    accountAmount: number,
    accountTypeId: number,
    accountIcon: string,
    accountColor: string
  ) => Promise<number>
  listCategoryTypes: () => Promise<CategoryTypeRecord[]>
  listCategories: () => Promise<CategoryRecord[]>
  addCategory: (
    categoryName: string,
    categoryAmount: number,
    categoryGroupId: number,
    categoryIcon: string,
    categoryColour: string
  ) => Promise<number>
  getVersion: () => Promise<string>
  updater: {
    onUpdateAvailable: (callback: (info: any) => void) => () => void
    onUpdateProgress: (callback: (percent: number) => void) => () => void
    onUpdateDownloaded: (callback: (info: any) => void) => () => void
    onUpdateError: (callback: (error: string) => void) => () => void
    startDownload: () => void
    quitAndInstall: () => void
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppApi
  }
}

export {}
