// LRU cache of decoded image object URLs (full quality; no downscale)
// Also provides a tiny "store" so React can re-render when cache updates.

const listeners = new Set()
let version = 0

function emit() {
  version += 1
  for (const cb of listeners) cb()
}

function subscribe(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot() {
  return version
}

class LRUImageCache {
  constructor({ maxEntries = 60, maxBytes = 300 * 1024 * 1024 } = {}) {
    this.maxEntries = maxEntries
    this.maxBytes = maxBytes

    /** @type {Map<string, any>} */
    this.map = new Map() // key = mediaPath, value = entry
    this.totalBytes = 0
  }

  get(path) {
    if (!path) return null
    const entry = this.map.get(path)
    if (!entry) return null
    // touch (LRU): delete + re-set moves to end in Map iteration order
    this.map.delete(path)
    this.map.set(path, entry)
    entry.lastUsedTs = Date.now()
    return entry
  }

  peek(path) {
    if (!path) return null
    return this.map.get(path) ?? null
  }

  hasDecoded(path) {
    const e = this.map.get(path)
    return !!(e && e.decoded && e.objectUrl)
  }

  set(entry) {
    const path = entry?.path
    if (!path) return

    // Replace existing
    const existing = this.map.get(path)
    if (existing) {
      this._revokeEntry(existing)
      this.map.delete(path)
      this.totalBytes -= existing.byteSize || 0
    }

    this.map.set(path, entry)
    this.totalBytes += entry.byteSize || 0

    this._evictIfNeeded()
    emit()
  }

  touch(path) {
    if (!path) return
    const entry = this.map.get(path)
    if (!entry) return
    this.map.delete(path)
    this.map.set(path, entry)
    entry.lastUsedTs = Date.now()
  }

  rename(oldPath, newPath, { emitNow = true } = {}) {
    if (!oldPath || !newPath) return
    if (oldPath === newPath) return

    const entry = this.map.get(oldPath)
    if (!entry) return

    // If destination already exists, remove it (and revoke its blob)
    const existing = this.map.get(newPath)
    if (existing) {
      this._revokeEntry(existing)
      this.map.delete(newPath)
      this.totalBytes -= existing.byteSize || 0
    }

    this.map.delete(oldPath)
    entry.path = newPath
    this.map.set(newPath, entry)

    // ✅ IMPORTANT: allow silent rename to avoid race with React state
    if (emitNow) emit()
  }


  delete(path) {
    if (!path) return
    const entry = this.map.get(path)
    if (!entry) return
    this._revokeEntry(entry)
    this.map.delete(path)
    this.totalBytes -= entry.byteSize || 0
    emit()
  }

  clear() {
    for (const entry of this.map.values()) {
      this._revokeEntry(entry)
    }
    this.map.clear()
    this.totalBytes = 0
    emit()
  }

  _evictIfNeeded() {
    while (this.map.size > this.maxEntries || this.totalBytes > this.maxBytes) {
      // Oldest is first in Map iteration order
      const oldestKey = this.map.keys().next().value
      if (oldestKey === undefined) break
      const entry = this.map.get(oldestKey)
      if (entry) {
        this._revokeEntry(entry)
        this.totalBytes -= entry.byteSize || 0
      }
      this.map.delete(oldestKey)
    }
  }

  _revokeEntry(entry) {
    try {
      if (entry?.objectUrl) URL.revokeObjectURL(entry.objectUrl)
    } catch (e) {
      // ignore
    }
  }

  // React external-store hooks need these:
  subscribe(cb) {
    return subscribe(cb)
  }
  getSnapshot() {
    return getSnapshot()
  }
}

export const imageCache = new LRUImageCache({
  maxEntries: 200,
  maxBytes: 900 * 1024 * 1024 // 900MB
})