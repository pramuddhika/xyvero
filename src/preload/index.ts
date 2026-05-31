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
  setConfigurationValue: (configurationKey: string, configurationValue: string): Promise<void> =>
    electronAPI.ipcRenderer.invoke('db:setConfigurationValue', configurationKey, configurationValue),
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
