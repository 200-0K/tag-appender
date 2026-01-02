import { ipcMain, app } from "electron";
import PreferenceStore from "../stores/PreferenceStore";
import fs from "fs";
import path from "path";

let configPath = null;

// Check if we are restarting from an update with a saved CWD
try {
  const updateCwdPath = path.join(app.getPath('userData'), 'update-cwd');
  if (fs.existsSync(updateCwdPath)) {
    configPath = fs.readFileSync(updateCwdPath, 'utf8');
    fs.unlinkSync(updateCwdPath); // Clean up
  }
} catch (e) {
  console.error('Failed to read update context:', e);
}

// Fallback to --current flag if no update context found
if (!configPath && process.argv.includes("--current")) {
  configPath = process.cwd();
}

const preferenceStore = new PreferenceStore({
  path: configPath,
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