/* eslint-disable prettier/prettier */
import { app, shell, BrowserWindow, ipcMain, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import iconPath from '../../resources/icon.png?asset'
import {
  getDatabase,
  getDatabasePathForApp,
  getConfigurationValue,
  listAccountTypes,
  listConfiguration,
  setConfigurationValue
} from './database'

const icon = nativeImage.createFromPath(iconPath)
let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function setupAutoUpdater(): void {
  // Disable automatic downloading of updates, we will ask first
  autoUpdater.autoDownload = false

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('updater:available', info)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow?.webContents.send('updater:progress', progressObj.percent)
  })

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('updater:downloaded', info)
  })

  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('updater:error', err?.message || String(err))
  })

  ipcMain.on('updater:start-download', () => {
    autoUpdater.downloadUpdate()
  })

  ipcMain.on('updater:quit-and-install', () => {
    autoUpdater.quitAndInstall()
  })

  // Check for updates and notify user if an update is found
  autoUpdater.checkForUpdatesAndNotify()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Ensure local SQLite file, tables, and seed data are ready at app startup.
  getDatabase()

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.xyvero')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))
  ipcMain.handle('db:getPath', () => getDatabasePathForApp())
  ipcMain.handle('db:listConfiguration', () => listConfiguration())
  ipcMain.handle('db:getConfigurationValue', (_, configurationKey: string) => {
    return getConfigurationValue(configurationKey)
  })
  ipcMain.handle(
    'db:setConfigurationValue',
    (_, configurationKey: string, configurationValue: string) => {
      setConfigurationValue(configurationKey, configurationValue)
    }
  )
  ipcMain.handle('db:listAccountTypes', () => listAccountTypes())

  createWindow()

  // Setup auto updates checking
  setupAutoUpdater()

  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(icon)
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
