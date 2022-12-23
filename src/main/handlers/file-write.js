const { ipcMain } = require("electron");
const fs = require("fs");

ipcMain.handle("file-write", (event, file, content) => {
  if (!fs.existsSync(file)) return false;
  fs.appendFileSync(file, content);
  return true;
});