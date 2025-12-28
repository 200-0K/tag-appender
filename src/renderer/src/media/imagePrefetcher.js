import { imageCache } from './imageCache'
import { toImgxUrl } from './imgxUrl'

const inFlight = new Map() // path -> { abort, promise }
const queue = [] // array of { path }
let activeCount = 0

const MAX_CONCURRENT = 4

function idle(fn) {
  if (typeof window === 'undefined') return setTimeout(fn, 0)
  if ('requestIdleCallback' in window) return window.requestIdleCallback(fn, { timeout: 500 })
  return setTimeout(fn, 0)
}

async function fetchBytes(imgxUrl, signal) {
  const res = await fetch(imgxUrl, { signal, cache: 'force-cache' })
  if (!res.ok) throw new Error(`fetch failed: ${res.status} ${res.statusText}`)
  const mime = res.headers.get('content-type') || 'application/octet-stream'
  const buf = await res.arrayBuffer()
  return { buf, mime }
}

async function decodeObjectUrl(objectUrl) {
  const img = new Image()
  img.decoding = 'async'
  img.src = objectUrl
  if (img.decode) await img.decode()
  else {
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
    })
  }
  return { width: img.naturalWidth, height: img.naturalHeight }
}

function pump() {
  while (activeCount < MAX_CONCURRENT && queue.length > 0) {
    const { path } = queue.shift()
    if (!path) continue
    if (imageCache.hasDecoded(path)) continue
    if (inFlight.has(path)) continue
    activeCount++
    imagePrefetcher._start(path)
  }
}

export const imagePrefetcher = {
  prefetchAround({ medias, index, radius = 2, skipAboveBytes = 80 * 1024 * 1024 }) {
    if (!Array.isArray(medias) || index == null) return

    const paths = []
    for (let d = -radius; d <= radius; d++) {
      if (d === 0) continue
      const m = medias[index + d]
      if (!m?.path) continue

      const type = (m.type || '').toLowerCase()
      const isImage = type.startsWith('image')
      if (!isImage) continue

      // ✅ optional safety: don’t prefetch animated gifs
      if (type === 'image/gif' || m.path.toLowerCase().endsWith('.gif')) continue

      if (typeof m.size === 'number' && m.size > skipAboveBytes) continue
      paths.push(m.path)
    }

    this.prefetchPaths(paths)
  },

  prefetchPaths(paths) {
    if (!Array.isArray(paths) || paths.length === 0) return
    const keep = new Set(paths)

    // Abort in-flight not needed
    for (const [path, job] of inFlight.entries()) {
      if (!keep.has(path)) {
        try { job.abort.abort() } catch {}
        inFlight.delete(path)
      }
    }

    // Remove queued items not needed
    for (let i = queue.length - 1; i >= 0; i--) {
      if (!keep.has(queue[i].path)) queue.splice(i, 1)
    }

    for (const path of paths) {
      if (!path) continue
      if (imageCache.hasDecoded(path)) continue
      if (inFlight.has(path)) continue
      if (queue.some((q) => q.path === path)) continue

      idle(() => {
        if (imageCache.hasDecoded(path)) return
        if (inFlight.has(path)) return
        queue.push({ path })
        pump()
      })
    }
  },

  _start(path) {
    const abort = new AbortController()
    const promise = this._prefetchOne(path, abort.signal).catch(() => {})
    inFlight.set(path, { abort, promise })

    promise.finally(() => {
      const cur = inFlight.get(path)
      if (cur?.abort === abort) inFlight.delete(path)
      activeCount = Math.max(0, activeCount - 1)
      pump()
    })
  },

  async _prefetchOne(path, signal) {
    const imgxUrl = toImgxUrl(path)
    if (!imgxUrl) return
    let objectUrl = null

    try {
      const { buf, mime } = await fetchBytes(imgxUrl, signal)
      if (signal?.aborted) return

      const blob = new Blob([buf], { type: mime })
      objectUrl = URL.createObjectURL(blob)

      const dims = await decodeObjectUrl(objectUrl)

      imageCache.set({
        path,
        objectUrl,
        mime,
        byteSize: buf.byteLength || 0,
        decoded: true,
        width: dims.width,
        height: dims.height,
        lastUsedTs: Date.now()
      })
    } catch {
      if (objectUrl) {
        try { URL.revokeObjectURL(objectUrl) } catch {}
      }
    }
  },

  clear() {
    for (const job of inFlight.values()) {
      try { job.abort.abort() } catch {}
    }
    inFlight.clear()
    queue.length = 0
    activeCount = 0
  }
}
