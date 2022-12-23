
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

export function getFileNameTags(filename, { delimiter = ",", includedIn = null } = {}) {
  let filenameClean = getFileWithoutExtension(filename);
  let tags = filenameClean.split(delimiter).slice(1);
  if (Array.isArray(includedIn)) tags = tags.filter(tag => includedIn.includes(tag));
  return tags;
}

export function getFileNameWithoutTags(filename, { delimiter = ",", customTags = null } = {}) {
  let ext = getFileExtension(filename);
  if (ext) ext = "." + ext;

  let filenameClean = getFileWithoutExtension(filename);

  let tags = [];
  let delimiterIndex = filenameClean.indexOf(delimiter);
  if (delimiterIndex < 0) delimiterIndex = undefined;
  else tags = filenameClean.slice(delimiterIndex + 1).split(delimiter)

  if (Array.isArray(customTags)) tags = tags.filter(tag => !customTags.includes(tag))
  else if (customTags === null) tags = [];

  return filenameClean.slice(0, delimiterIndex) + (tags.length > 0 ? `${delimiter}${tags.join(delimiter)}` : "") + ext;
}

export function addTagsToFileName(filename, tags = [], delimiter = ",") {
  let ext = getFileExtension(filename);
  if (ext) ext = "." + ext;

  const filenameClean = getFileWithoutExtension(filename);

  let suffix = tags.join(",");
  if (suffix) suffix = delimiter + suffix;

  return filenameClean + suffix + ext;
}