/* eslint-disable prettier/prettier */
import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getDatabasePath: (): Promise<string> => electronAPI.ipcRenderer.invoke('db:getPath'),
  listConfiguration: (): Promise<
    Array<{
      configuration_id: number
      configuration_key: string
      configuration_value: string
    }>
  > => electronAPI.ipcRenderer.invoke('db:listConfiguration'),
  getConfigurationValue: (
    configurationKey: string
  ): Promise<
    | {
        configuration_id: number
        configuration_key: string
        configuration_value: string
      }
    | undefined
  > => electronAPI.ipcRenderer.invoke('db:getConfigurationValue', configurationKey),
  setConfigurationValue: (configurationKey: string, configurationValue: string): Promise<void> =>
    electronAPI.ipcRenderer.invoke(
      'db:setConfigurationValue',
      configurationKey,
      configurationValue
    ),
  listAccountTypes: (): Promise<
    Array<{
      account_type_id: number
      account_type: string
      account_type_name: string
    }>
  > => electronAPI.ipcRenderer.invoke('db:listAccountTypes'),
  listCategoryTypes: (): Promise<
    Array<{
      category_id: number
      category_type: string
      category_name: string
    }>
  > => electronAPI.ipcRenderer.invoke('db:listCategoryTypes'),
  listCategories: (): Promise<
    Array<{
      category_id: number
      category_name: string
      category_amount: number
      category_group_id: number
      category_icon: string
      category_colour: string
      is_active: number
    }>
  > => electronAPI.ipcRenderer.invoke('db:listCategories'),
  addCategory: (
    categoryName: string,
    categoryAmount: number,
    categoryGroupId: number,
    categoryIcon: string,
    categoryColour: string
  ): Promise<number> =>
    electronAPI.ipcRenderer.invoke(
      'db:addCategory',
      categoryName,
      categoryAmount,
      categoryGroupId,
      categoryIcon,
      categoryColour
    ),
  listAccounts: (): Promise<
    Array<{
      account_id: number
      account_name: string
      account_amount: number
      account_type_id: number
      account_color: string
      account_icon: string
      is_active: number
    }>
  > => electronAPI.ipcRenderer.invoke('db:listAccounts'),
  addAccount: (
    accountName: string,
    accountAmount: number,
    accountTypeId: number,
    accountIcon: string,
    accountColor: string
  ): Promise<number> =>
    electronAPI.ipcRenderer.invoke(
      'db:addAccount',
      accountName,
      accountAmount,
      accountTypeId,
      accountIcon,
      accountColor
    ),
  listTransactionTypes: (): Promise<
    Array<{
      transaction_type_id: number
      transaction_type_name: string
    }>
  > => electronAPI.ipcRenderer.invoke('db:listTransactionTypes'),
  listTransactions: (): Promise<
    Array<{
      time_stamp: string
      transaction_time: string
      transaction_type_id: number
      to_account_id: number
      from_account_id?: number | null
      category_id?: number | null
      amount: number
      fees?: number | null
      note: string
    }>
  > => electronAPI.ipcRenderer.invoke('db:listTransactions'),
  addTransaction: (
    transactionTime: string,
    transactionTypeId: number,
    toAccountId: number,
    fromAccountId: number | null | undefined,
    categoryId: number | null | undefined,
    amount: number,
    fees: number = 0,
    note: string
  ): Promise<string> =>
    electronAPI.ipcRenderer.invoke(
      'db:addTransaction',
      transactionTime,
      transactionTypeId,
      toAccountId,
      fromAccountId,
      categoryId,
      amount,
      fees,
      note
    ),
  getVersion: (): Promise<string> => electronAPI.ipcRenderer.invoke('app:getVersion'),
  updater: {
    onUpdateAvailable: (
      callback: (info: { version?: string; [key: string]: unknown }) => void
    ): (() => void) => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        info: { version?: string; [key: string]: unknown }
      ): void => callback(info)
      electronAPI.ipcRenderer.on('updater:available', listener)
      return (): void => {
        electronAPI.ipcRenderer.removeListener('updater:available', listener)
      }
    },
    onUpdateProgress: (callback: (percent: number) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, percent: number): void => callback(percent)
      electronAPI.ipcRenderer.on('updater:progress', listener)
      return (): void => {
        electronAPI.ipcRenderer.removeListener('updater:progress', listener)
      }
    },
    onUpdateDownloaded: (
      callback: (info: { version?: string; [key: string]: unknown }) => void
    ): (() => void) => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        info: { version?: string; [key: string]: unknown }
      ): void => callback(info)
      electronAPI.ipcRenderer.on('updater:downloaded', listener)
      return (): void => {
        electronAPI.ipcRenderer.removeListener('updater:downloaded', listener)
      }
    },
    onUpdateError: (callback: (error: string) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, error: string): void => callback(error)
      electronAPI.ipcRenderer.on('updater:error', listener)
      return (): void => {
        electronAPI.ipcRenderer.removeListener('updater:error', listener)
      }
    },
    startDownload: (): void => {
      electronAPI.ipcRenderer.send('updater:start-download')
    },
    quitAndInstall: (): void => {
      electronAPI.ipcRenderer.send('updater:quit-and-install')
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
