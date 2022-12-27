import { ipcMain } from "electron";
import fs from "fs";

ipcMain.handle("file-create", (event, file) => {
  try {
    fs.openSync(file, "wx")
  } catch (e) {
    console.error(e)
    return false;
  }
  return true;
});

ipcMain.handle("file-read", (event, file, { delimiter } = {}) => {
  if (!fs.existsSync(file)) return null;
  let result = fs.readFileSync(file).toString();
  if (delimiter) result = result.split(delimiter).map(str => str.trim());
  return result;
});

ipcMain.handle("file-write", (event, file, content) => {
  if (!fs.existsSync(file)) return false;
  fs.appendFileSync(file, content);
  return true;
});

ipcMain.handle("file-rename", (event, oldPath, newPath) => {
  if (!fs.existsSync(oldPath)) return null;
  fs.renameSync(oldPath, newPath);
  return newPath;
});