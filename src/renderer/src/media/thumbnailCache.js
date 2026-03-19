import { toImgxUrl } from './imgxUrl'

const THUMB_SIZE = 56
const MAX_THUMBNAILS = 160
const cache = new Map()
const inFlight = new Map()

function touch(path, value) {
  cache.delete(path)
  cache.set(path, value)

  while (cache.size > MAX_THUMBNAILS) {
    const oldestKey = cache.keys().next().value
    if (oldestKey === undefined) break
    cache.delete(oldestKey)
  }
}

function canvasToDataUrl(source, width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = THUMB_SIZE
  canvas.height = THUMB_SIZE

  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) return null

  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, THUMB_SIZE, THUMB_SIZE)

  const scale = Math.max(THUMB_SIZE / width, THUMB_SIZE / height)
  const drawWidth = width * scale
  const drawHeight = height * scale
  const dx = (THUMB_SIZE - drawWidth) / 2
  const dy = (THUMB_SIZE - drawHeight) / 2

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'low'
  ctx.drawImage(source, dx, dy, drawWidth, drawHeight)

  return canvas.toDataURL('image/webp', 0.55)
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function loadVideo(url) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.src = url

    const cleanup = () => {
      video.pause()
      video.removeAttribute('src')
      video.load()
    }

    const fail = () => {
      cleanup()
      reject(new Error('video thumbnail failed'))
    }

    video.onerror = fail
    video.onloadedmetadata = () => {
      const targetTime =
        Number.isFinite(video.duration) && video.duration > 0.12 ? 0.1 : 0

      const finish = () => resolve({ video, cleanup })

      if (targetTime === 0) {
        if (video.readyState >= 2) finish()
        else video.onloadeddata = finish
        return
      }

      video.onseeked = finish
      try {
        video.currentTime = targetTime
      } catch {
        if (video.readyState >= 2) finish()
        else video.onloadeddata = finish
      }
    }

    video.load()
  })
}

async function createImageThumbnail(path) {
  const img = await loadImage(toImgxUrl(path))
  return canvasToDataUrl(img, img.naturalWidth || THUMB_SIZE, img.naturalHeight || THUMB_SIZE)
}

async function createVideoThumbnail(path) {
  const { video, cleanup } = await loadVideo(toImgxUrl(path))
  try {
    const width = video.videoWidth || THUMB_SIZE
    const height = video.videoHeight || THUMB_SIZE
    return canvasToDataUrl(video, width, height)
  } finally {
    cleanup()
  }
}

export function getCachedThumbnail(path) {
  if (!path) return null
  const cached = cache.get(path)
  if (!cached) return null
  touch(path, cached)
  return cached
}

export function requestThumbnail(media) {
  const path = media?.path
  const type = (media?.type || '').toLowerCase()
  if (!path) return Promise.resolve(null)

  const cached = cache.get(path)
  if (cached) {
    touch(path, cached)
    return Promise.resolve(cached)
  }

  if (inFlight.has(path)) return inFlight.get(path)

  const job = (async () => {
    try {
      let result = null
      if (type.startsWith('image')) result = await createImageThumbnail(path)
      else if (type.startsWith('video')) result = await createVideoThumbnail(path)

      if (result) touch(path, result)
      return result
    } catch {
      return null
    } finally {
      inFlight.delete(path)
    }
  })()

  inFlight.set(path, job)
  return job
}
