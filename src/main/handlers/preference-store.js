import { ipcMain } from "electron";
import PreferenceStore from "../stores/PreferenceStore";

const preferenceStore = new PreferenceStore({
  path: process.argv.includes("--current") ? process.cwd() : null,
  // defaults: {
  //   dir: null,
  //   currentImgIndex: null,
  //   currentProfile: null,
  //   moveLocation: null
  // }
});

ipcMain.handle("preference-store-get", () => preferenceStore.prefs);
ipcMain.handle("preference-store-update", (events, prefs) => !!preferenceStore.updatePrefs(prefs));

ipcMain.handle("workspaces-get", () => preferenceStore.getWorkspaces());
ipcMain.handle("workspace-create", (event, name) => preferenceStore.createWorkspace(name));
ipcMain.handle("workspace-switch", (event, id) => preferenceStore.switchWorkspace(id));
ipcMain.handle("workspace-delete", (event, id) => preferenceStore.deleteWorkspace(id));