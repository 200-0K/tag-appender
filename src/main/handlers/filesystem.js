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

ipcMain.handle('file-move', (event, src, dest, options = {}) => {
  const { withSiblings } = options
  if (
    !(fs.existsSync(src) && fs.lstatSync(src).isFile()) ||
    !(fs.existsSync(dest) && fs.lstatSync(dest).isDirectory())
  )
    return null
  const newPath = path.resolve(dest, path.basename(src))
  renameFileSync(src, newPath, { withSiblings })
  return newPath.replace(/\\/g, '/')
})

ipcMain.handle('file-rename', (event, oldPath, newPath, options = {}) => {
  const { withSiblings } = options
  if (
    !(fs.existsSync(oldPath) && fs.lstatSync(oldPath).isFile()) ||
    (fs.existsSync(newPath) && fs.lstatSync(newPath).isFile())
  )
    return null
  renameFileSync(oldPath, newPath, { withSiblings })
  return newPath
})

function renameFileSync(oldPath, newPath, options = {}) {
  const { withSiblings } = options

  fs.renameSync(oldPath, newPath)

  if (withSiblings) {
    const siblings = getSiblings(oldPath) ?? []
    const parsedNewPath = path.parse(newPath)
    siblings.forEach((sibling) => {
      fs.renameSync(sibling, path.join(parsedNewPath.dir, path.basename(sibling)))
    })
  }
}

function getSiblings(filePath) {
  if (!filePath) return null
  const parsedFile = path.parse(filePath)
  const dir = path.resolve(parsedFile.dir)
  const dirFiles = fs.readdirSync(dir);
  const siblings = dirFiles.map(file => path.join(dir, file)).filter(filePath => {
    const tempParsed = path.parse(filePath);
    return tempParsed.name === parsedFile.name;
  })  
  return siblings
}
