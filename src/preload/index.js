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

  readJsonFile: (filepath) => ipcRenderer.invoke('file-read', filepath).then(res => res ? JSON.parse(res) : null),
  writeJsonFile: (filepath, data) => ipcRenderer.invoke('file-write', filepath, JSON.stringify(data, null, 2)),

  moveFile: (src, dest, options) => ipcRenderer.invoke('file-move', src, dest, options),
  renameFile: (oldPath, newPath, options) => ipcRenderer.invoke('file-rename', oldPath, newPath, options),
  deleteFile: (filepath) => ipcRenderer.invoke('file-delete', filepath),

  getPreference: () => ipcRenderer.invoke('preference-store-get'),
  updatePreference: (prefs) => ipcRenderer.invoke('preference-store-update', prefs),

  getWorkspaces: () => ipcRenderer.invoke('workspaces-get'),
  createWorkspace: (name) => ipcRenderer.invoke('workspace-create', name),
  switchWorkspace: (id) => ipcRenderer.invoke('workspace-switch', id),
  deleteWorkspace: (id) => ipcRenderer.invoke('workspace-delete', id),

  executeScript: (script) => ipcRenderer.invoke('execute-script', script),
  openFile: (filepath) => ipcRenderer.invoke('file-open', filepath),

  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onUpdateStatus: (callback) => {
    const listener = (_, value) => callback(value.status, value)
    ipcRenderer.on('update-status', listener)
    return () => ipcRenderer.removeListener('update-status', listener)
  }
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
