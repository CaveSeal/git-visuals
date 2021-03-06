'use strict'

import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import {join} from 'path'
import {readFileSync, writeFileSync} from 'fs'

if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  const opts = {
    width: 800, height: 600
  }

  const store = new Store({
    data: { window: opts }
  })

  const window = store.get('window')

  mainWindow = new BrowserWindow({
    frame: false,
    height: window.height,
    titleBarStyle: 'hiddenInset',
    transparent: true,
    useContentSize: true,
    width: window.width
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.on('resize', () => {
    const bounds = mainWindow.getBounds()

    store.set('window', {
      height: bounds.height,
      width: bounds.width
    })
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on('openFolder', (event, path) => {
  dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  }, paths => event.sender.send('folders', paths))
})

class Store {
  constructor (opts = {}) {
    opts.name = (opts.name || 'user-data') + '.json'

    this.path = join(app.getPath('userData'), opts.name)

    try {
      this.data = JSON.parse(readFileSync(this.path))
    } catch (error) {
      this.data = opts.data || {}
    }
  }

  get (key) {
    return this.data[key]
  }

  set (key, value) {
    this.data[key] = value
    writeFileSync(this.path, JSON.stringify(this.data))
  }
}
