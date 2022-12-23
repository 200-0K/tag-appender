import { contextBridge, ipcRenderer } from 'electron'
// import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  directoryPicker: () => ipcRenderer.invoke("directory-picker"),
  directoryScanner: (dir, options) => ipcRenderer.invoke("directory-scanner", dir, options),
  profileScanner: () => ipcRenderer.invoke("directory-scanner", null, { filter: "ta" }),
  renameFile: (oldPath, newPath) => ipcRenderer.invoke("file-rename", oldPath, newPath),
  readTagFile: file => ipcRenderer.invoke("file-read", file, { delimiter: "\n" }),
  appendTagToFile: (file, tag) => ipcRenderer.invoke("file-write", file, "\n" + tag),
  getPreference: () => ipcRenderer.invoke("preference-store-get"),
  updatePreference: prefs => ipcRenderer.invoke("preference-store-update", prefs)
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
