const { ipcMain } = require('electron')
const glob = require('glob')
const path = require('path')
const fs = require('fs')

const imageFormats = ['jpg', 'jpeg', 'png', 'bmp', 'webp', 'gif']
const videoFormats = ['mp4', 'webm', 'avi', 'mov']
const audioFormats = ['mp3']
const filterNames = {
  images: imageFormats.join(','),
  videos: videoFormats.join(','),
  medias: [...imageFormats, ...videoFormats, ...audioFormats].join(',')
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
    files = files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    files = files.map((file) => ({
      path: file,
      pathMeta: JSON.parse(JSON.stringify(path.parse(file))),
      type:
        [['image', imageFormats], ['video', videoFormats], ['audio', audioFormats]].find(
          ([name, formats]) => formats.some((format) => file.endsWith(`.${format}`))
        )?.[0] ?? 'n/a',
      sizeInMB: fs.statSync(file).size / (1024*1024)
    }))

    return files
  }
)
