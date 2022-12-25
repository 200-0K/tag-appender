import { ipcMain, dialog } from "electron";

ipcMain.handle("directory-picker", async () => {
  const picker = await dialog.showOpenDialog(null, {
    properties: ["openDirectory"]
  });
  return picker.canceled ? null : picker.filePaths?.[0];
});