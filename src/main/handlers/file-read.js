const { ipcMain } = require("electron");
const fs = require("fs");

ipcMain.handle("file-read", (event, file, { delimiter } = {}) => {
  if (!fs.existsSync(file)) return null;
  let result = fs.readFileSync(file).toString();
  if (delimiter) result = result.split(delimiter).map(str => str.trim());
  return result;
});