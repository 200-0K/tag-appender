import { ipcMain } from 'electron'
import glob from 'glob'
import path from 'path'

const filterNames = {
  images: 'jpg,jpeg,png,gif'
}

ipcMain.handle(
  'directory-scanner',
  (event, dir, { filter, filterName, absolute = true, filenameOnly = false } = {}) => {
    if (!dir) dir = process.cwd()

    let extFilter = filter ?? filterNames[filterName]
    extFilter = extFilter ? `.{${extFilter},}` : ''

    let files = glob.sync(path.resolve(dir, `*${extFilter}`), { absolute })
    if (!absolute) files = files.map((file) => path.basename(file))
    if (filenameOnly) files = files.map((file) => path.parse(file).name)
    return files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }
)
