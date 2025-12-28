import { app, shell, BrowserWindow, protocol } from 'electron'
import * as path from 'path'
import fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { glob } from 'glob'
import { Readable } from 'stream'
import mime from 'mime'

// MUST be called before app.whenReady()
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'imgx',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  }
])

if (is.dev) process.argv.push('--current')

function createWindow() {
  const files = glob.sync(path.join(__dirname, './handlers/**/*.js'))
  files.forEach((file) => require(file))

  const mainWindow = new BrowserWindow({
    minWidth: 640,
    minHeight: 440,
    show: false,
    autoHideMenuBar: true,
    title: `${app.getName()} - ${app.getVersion()}`,
    ...(process.platform === 'linux'
      ? { icon: path.join(__dirname, '../../build/icon.png') }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('did-finish-load', () => {
    try {
      mainWindow.setTitle(`${app.getName()} - ${app.getVersion()}`)
    } catch (e) {
      console.error(e)
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

function safeDecodeURIComponent(s) {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

function firstExistingPath(candidates) {
  for (let p of candidates) {
    if (!p) continue
    try {
      p = path.normalize(p)
      if (fs.existsSync(p)) return p
    } catch {
      // ignore
    }
  }
  return null
}

function resolveImgxToFsPath(requestUrl) {
  const u = new URL(requestUrl)
  const decodedPathname = safeDecodeURIComponent(u.pathname || '') // starts with "/"

  const isWin = process.platform === 'win32'
  const cwdRoot = isWin ? path.parse(process.cwd()).root : '/'

  const candidates = []

  if (isWin) {
    // CASE 1: imgx://l/gallery...  -> L:\gallery...
    if (u.hostname && /^[A-Za-z]$/.test(u.hostname)) {
      candidates.push(`${u.hostname.toUpperCase()}:` + decodedPathname) // "L:/gallery..."
    }

    // CASE 2: "/L:/..." -> "L:/..."
    if (/^\/[A-Za-z]:\//.test(decodedPathname)) {
      candidates.push(decodedPathname.slice(1))
    }

    // CASE 3: "/l/..." -> "L:/..."
    if (/^\/[A-Za-z]\//.test(decodedPathname)) {
      candidates.push(`${decodedPathname[1].toUpperCase()}:` + decodedPathname.slice(2))
    }

    // CASE 4: root folder like "C:\l\..."
    if (u.hostname) {
      candidates.push(path.join(cwdRoot, u.hostname, decodedPathname.replace(/^\//, '')))
    }

    // CASE 5: rooted path "\l\..."
    if (u.hostname) {
      candidates.push(path.join(cwdRoot, u.hostname + decodedPathname))
    } else {
      candidates.push(decodedPathname.replace(/\//g, '\\'))
    }

    // CASE 6: relative to cwd
    if (u.hostname) {
      candidates.push(path.resolve(process.cwd(), u.hostname, decodedPathname.replace(/^\//, '')))
    } else {
      candidates.push(path.resolve(process.cwd(), decodedPathname.replace(/^\//, '')))
    }
  } else {
    if (u.hostname) candidates.push('/' + u.hostname + decodedPathname)
    candidates.push(decodedPathname)
  }

  const normalized = candidates.map((p) => (isWin ? p.replace(/\//g, '\\') : p))
  return firstExistingPath(normalized)
}

function parseRange(rangeHeader, size) {
  // Example: "bytes=0-1023"
  const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader || '')
  if (!m) return null
  let start = m[1] === '' ? null : Number(m[1])
  let end = m[2] === '' ? null : Number(m[2])

  if (start === null && end === null) return null

  // suffix range: bytes=-500 (last 500 bytes)
  if (start === null && end !== null) {
    const suffix = end
    if (Number.isNaN(suffix)) return null
    start = Math.max(0, size - suffix)
    end = size - 1
  } else {
    if (Number.isNaN(start)) return null
    if (end === null || Number.isNaN(end)) end = size - 1
    if (start > end) return null
    end = Math.min(end, size - 1)
  }

  if (start < 0 || start >= size) return null
  return { start, end }
}

app.whenReady().then(() => {
  protocol.handle('imgx', async (request) => {
    try {
      const filePath = resolveImgxToFsPath(request.url)
      if (!filePath) return new Response('', { status: 404 })

      const stat = fs.statSync(filePath)
      if (!stat.isFile()) return new Response('', { status: 404 })

      const contentType = mime.getType(filePath) || 'application/octet-stream'
      const size = stat.size

      const headers = new Headers()
      headers.set('Content-Type', contentType)
      headers.set('Accept-Ranges', 'bytes')

      // Handle HEAD
      if ((request.method || 'GET').toUpperCase() === 'HEAD') {
        headers.set('Content-Length', String(size))
        return new Response(null, { status: 200, headers })
      }

      const rangeHeader = request.headers?.get?.('range') || request.headers?.get?.('Range')
      if (rangeHeader) {
        const r = parseRange(rangeHeader, size)
        if (!r) {
          headers.set('Content-Range', `bytes */${size}`)
          return new Response('', { status: 416, headers })
        }

        const chunkSize = r.end - r.start + 1
        headers.set('Content-Range', `bytes ${r.start}-${r.end}/${size}`)
        headers.set('Content-Length', String(chunkSize))

        const nodeStream = fs.createReadStream(filePath, { start: r.start, end: r.end })
        const webStream = Readable.toWeb(nodeStream)
        return new Response(webStream, { status: 206, headers })
      }

      // Full file
      headers.set('Content-Length', String(size))
      const nodeStream = fs.createReadStream(filePath)
      const webStream = Readable.toWeb(nodeStream)
      return new Response(webStream, { status: 200, headers })
    } catch (e) {
      console.error('imgx handler error:', e)
      return new Response('', { status: 404 })
    }
  })

  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
