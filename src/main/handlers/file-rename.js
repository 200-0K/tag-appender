import { ipcMain } from "electron";
import fs from "fs";

ipcMain.handle("file-rename", (event, oldPath, newPath) => {
  if (!fs.existsSync(oldPath)) return null;
  fs.renameSync(oldPath, newPath);
  return newPath;
});