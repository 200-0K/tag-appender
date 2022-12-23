const { ipcMain } = require("electron");
const fs = require("fs");

ipcMain.handle("file-rename", (event, oldPath, newPath) => {
  if (!fs.existsSync(oldPath)) return null;
  fs.renameSync(oldPath, newPath);
  return newPath;
});