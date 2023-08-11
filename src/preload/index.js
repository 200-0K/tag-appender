import { contextBridge, ipcRenderer } from 'electron'
// import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const tagsPath = process.cwd()

const api = {
  directoryPicker: () => ipcRenderer.invoke('directory-picker'),
  directoryScanner: (dir, options) => ipcRenderer.invoke('directory-scanner', dir, options),

  profileScanner: () => ipcRenderer.invoke('directory-scanner', tagsPath, { filter: 'ta' }),

  createTagFile: (filepath) => ipcRenderer.invoke('file-create', filepath),
  readTagFile: (filepath) => ipcRenderer.invoke('file-read', filepath, { delimiter: ',' }),
  writeTagsToFile: (filepath, tags) => ipcRenderer.invoke('file-write', filepath, tags.join(',')),
  appendTagToFile: (filepath, tag) => ipcRenderer.invoke('file-write', filepath, ',' + tag, { append: true }),

  moveFile: (src, dest, options) => ipcRenderer.invoke('file-move', src, dest, options),
  renameFile: (oldPath, newPath, options) => ipcRenderer.invoke('file-rename', oldPath, newPath, options),

  getPreference: () => ipcRenderer.invoke('preference-store-get'),
  updatePreference: (prefs) => ipcRenderer.invoke('preference-store-update', prefs),

  executeScript: (script) => ipcRenderer.invoke('execute-script', script)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    // contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // window.electron = electronAPI
  window.api = api
}
