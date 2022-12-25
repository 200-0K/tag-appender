import { ipcMain } from "electron";
import PreferenceStore from "../stores/PreferenceStore";

const preferenceStore = new PreferenceStore({
  path: process.argv.includes("--current") ? process.cwd() : null,
  defaults: {
    dir: null,
    currentImgIndex: -1,
    currentProfile: null
  }
});

ipcMain.handle("preference-store-get", () => preferenceStore.prefs);
ipcMain.handle("preference-store-update", (events, prefs) => !!preferenceStore.updatePrefs(prefs));