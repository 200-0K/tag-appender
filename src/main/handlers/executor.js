import { ipcMain } from 'electron'
import { exec } from 'child_process'

ipcMain.handle('execute-script', async (event, script) => {
  return new Promise((res, rej) => {
    exec(script, (err, stdout, stderr) => {
      if (stderr) rej(stderr)
      else res(stdout)
    })
  })
})
