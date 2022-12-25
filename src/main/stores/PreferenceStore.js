import { app } from 'electron'
import Store from 'electron-store'

export default class PreferenceStore extends Store {
  constructor({ path, defaults = {} } = {}) {
    super({
      cwd: path ?? app.getPath('userData'),
      defaults: {
        prefs: {
          ...defaults
        }
      }
    })

    this.defaults = defaults
    this.prefs = this.get('prefs') || {}
  }

  savePrefs() {
    this.set('prefs', this.prefs)
    return this
  }

  reloadPrefs() {
    this.prefs = this.get('prefs') || {}
    return this
  }

  updatePrefs(newPrefs = {}) {
    // const filteredPrefs = Object.keys(this.defaults).reduce((acc, cur) => ({ ...acc, [cur]: prefs[cur] ?? this.defaults[cur] }), {});
    this.prefs = {
      ...this.defaults,
      ...this.prefs,
      ...newPrefs
    }
    return this.savePrefs()
  }
}