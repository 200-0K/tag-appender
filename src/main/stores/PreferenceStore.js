import { app } from 'electron'
import Store from 'electron-store'

export default class PreferenceStore extends Store {
  constructor({ path, defaults = {} } = {}) {
    super({
      cwd: path ?? app.getPath('userData')
    })

    this.initWorkspaces(defaults)
  }

  initWorkspaces(defaults = {}) {
    const oldPrefs = this.get('prefs')
    const hasWorkspaces = this.has('workspaces')

    if (oldPrefs && !hasWorkspaces) {
      // Migrate old prefs to default workspace
      const defaultWorkspace = {
        id: 'default',
        name: 'Default',
        dir: oldPrefs.dir || null,
        currentProfile: oldPrefs.currentProfile || null,
        moveLocation: oldPrefs.moveLocation || null,
        autotagScript: oldPrefs.autotagScript || null,
        currentMediaPath: oldPrefs.currentMediaPath || null
      }
      this.set('workspaces', [defaultWorkspace])
      this.set('activeWorkspaceId', 'default')
      this.delete('prefs') // Clean up old prefs
      this.migrated = true
    }

    if (!this.has('workspaces')) {
      // Fresh install or no workspaces found
      const defaultWorkspace = {
        id: 'default',
        name: 'Default',
        dir: defaults.dir || null,
        currentProfile: defaults.currentProfile || null,
        moveLocation: defaults.moveLocation || null,
        autotagScript: defaults.autotagScript || null,
        currentMediaPath: defaults.currentMediaPath || null
      }
      this.set('workspaces', [defaultWorkspace])
      this.set('activeWorkspaceId', 'default')
    }

    this.activeWorkspaceId = this.get('activeWorkspaceId')
    this.workspaces = this.get('workspaces') || []

    // Validation: Ensure activeWorkspaceId exists in workspaces
    if (!this.workspaces.find((w) => w.id === this.activeWorkspaceId)) {
      this.activeWorkspaceId = this.workspaces[0]?.id || 'default'
      this.saveWorkspaces()
    }
  }

  get activeWorkspace() {
    return this.workspaces.find((w) => w.id === this.activeWorkspaceId) || this.workspaces[0]
  }

  get prefs() {
    const active = this.activeWorkspace
    return {
      dir: active.dir,
      currentProfile: active.currentProfile,
      moveLocation: active.moveLocation,
      autotagScript: active.autotagScript,
      currentMediaPath: active.currentMediaPath
    }
  }

  saveWorkspaces() {
    this.set('workspaces', this.workspaces)
    this.set('activeWorkspaceId', this.activeWorkspaceId)
    return this
  }

  updatePrefs(newPrefs = {}) {
    const activeIndex = this.workspaces.findIndex((w) => w.id === this.activeWorkspaceId)
    if (activeIndex !== -1) {
      this.workspaces[activeIndex] = {
        ...this.workspaces[activeIndex],
        ...newPrefs
      }
      this.saveWorkspaces()
    }
    return this
  }

  createWorkspace(name) {
    const newWorkspace = {
      id: Date.now().toString(),
      name,
      dir: null,
      currentProfile: null,
      moveLocation: null,
      autotagScript: null,
      currentMediaPath: null
    }
    this.workspaces.push(newWorkspace)
    this.activeWorkspaceId = newWorkspace.id
    this.saveWorkspaces()
    return newWorkspace
  }

  switchWorkspace(id) {
    const workspace = this.workspaces.find((w) => w.id === id)
    if (workspace) {
      this.activeWorkspaceId = id
      this.saveWorkspaces()
      return workspace
    }
    return null
  }

  deleteWorkspace(id) {
    if (this.workspaces.length <= 1) return false
    this.workspaces = this.workspaces.filter((w) => w.id !== id)
    if (this.activeWorkspaceId === id) {
      this.activeWorkspaceId = this.workspaces[0].id
    }
    this.saveWorkspaces()
    return true
  }

  getWorkspaces() {
    return {
      workspaces: this.workspaces,
      activeWorkspaceId: this.activeWorkspaceId,
      migrated: !!this.migrated
    }
  }
}