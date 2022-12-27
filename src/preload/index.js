import { contextBridge, ipcRenderer } from 'electron'
import path from "path"
// import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const tagsPath = process.cwd()
const resolveTagFilePath = filename => path.join(tagsPath, filename + ".ta")
const api = {
  directoryPicker: () => ipcRenderer.invoke("directory-picker"),
  directoryScanner: (dir, options) => ipcRenderer.invoke("directory-scanner", dir, options),

  profileScanner: () => ipcRenderer.invoke("directory-scanner", tagsPath, { filter: "ta", filenameOnly:true }),

  createTagFile: filename => ipcRenderer.invoke("file-create", resolveTagFilePath(filename)),
  readTagFile: filename => ipcRenderer.invoke("file-read", resolveTagFilePath(filename), { delimiter: "\n" }),
  appendTagToFile: (filename, tag) => ipcRenderer.invoke("file-write", resolveTagFilePath(filename), "\n" + tag),

  renameFile: (oldPath, newPath) => ipcRenderer.invoke("file-rename", oldPath, newPath),

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
