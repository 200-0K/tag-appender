
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