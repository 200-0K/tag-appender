import { ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'

ipcMain.handle('file-create', (event, file) => {
  try {
    fs.openSync(file, 'wx')
  } catch (e) {
    console.error(e)
    return false
  }
  return true
})

ipcMain.handle('file-read', (event, file, { delimiter } = {}) => {
  if (!fs.existsSync(file) || (fs.existsSync(file) && fs.lstatSync(file).isDirectory())) return null
  let result = fs.readFileSync(file).toString()
  if (delimiter) result = result.split(delimiter).map((str) => str.trim())
  return result
})

ipcMain.handle('file-write', (event, file, content, { append = false } = {}) => {
  if (fs.existsSync(file) && fs.lstatSync(file).isDirectory()) return false
  if (append) fs.appendFileSync(file, content)
  else fs.writeFileSync(file, content)
  return true
})

ipcMain.handle('file-move', (event, src, dest) => {
  if (
    !(fs.existsSync(src) && fs.lstatSync(src).isFile()) ||
    !(fs.existsSync(dest) && fs.lstatSync(dest).isDirectory())
  )
    return null
  const newPath = path.resolve(dest, path.basename(src))
  fs.renameSync(src, newPath)
  return newPath.replace(/\\/g, '/')
})

ipcMain.handle('file-rename', (event, oldPath, newPath) => {
  if (
    !(fs.existsSync(oldPath) && fs.lstatSync(oldPath).isFile()) ||
    (fs.existsSync(newPath) && fs.lstatSync(newPath).isFile())
  )
    return null
  fs.renameSync(oldPath, newPath)
  return newPath
})
