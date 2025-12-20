
export function getFileName(path) {
  return path.slice([...path.matchAll(/[\\/]/gi)].at(-1)?.index + 1);
}

export function getFileParentPath(path) {
  return path.slice(0, [...path.matchAll(/[\\/]/gi)].at(-1)?.index + 1);
}

export function getFileExtension(filename) {
  const extIndex = filename.lastIndexOf(".");
  const ext = extIndex > 0 ? filename.slice(extIndex + 1) : "";
  return ext;
}

export function getFileWithoutExtension(filename) {
  let extIndex = filename.lastIndexOf(".");
  if (extIndex < 0) extIndex = undefined;
  return filename.slice(0, extIndex);
}

export function inLocation(mediaPath, moveLocation, { level = null } = {}) {
  const norm = s => String(s).replace(/\\/g, "/").replace(/\/+$/g, "").toLowerCase();

  const mp = norm(mediaPath);
  const ml = norm(moveLocation);

  if (!mp.startsWith(ml.endsWith("/") ? ml : ml + "/")) return false;

  // remove base + "/" then count folders before filename
  const rest = mp.slice((ml.endsWith("/") ? ml : ml + "/").length);
  const folders = rest.split("/").slice(0, -1).filter(Boolean).length;

  return level == null ? true : folders === level;
}