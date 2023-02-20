import { ipcMain, dialog, BrowserWindow } from 'electron'

ipcMain.handle('directory-picker', async (event) => {
  const picker = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), {
    properties: ['openDirectory']
  })
  return picker.canceled ? null : picker.filePaths?.[0].replace(/\\/g, '/')
})
