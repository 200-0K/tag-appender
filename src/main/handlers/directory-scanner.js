const { ipcMain } = require("electron");
const glob = require("glob");
const path = require("path");

const filterNames = {
  "images": "jpg,jpeg,png,gif"
}

ipcMain.handle("directory-scanner", (event, dir, options) => {
  if (!dir) dir = process.cwd();

  let extFilter = options?.filter ?? filterNames[options?.filterName];
  extFilter = extFilter ? `.{${extFilter},}` : "";

  const files = glob.sync(path.resolve(dir, `*${extFilter}`));
  return files.sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));
})