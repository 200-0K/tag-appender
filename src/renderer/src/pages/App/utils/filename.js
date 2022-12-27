import {
  addTagsToFileName,
  getFileName,
  getFileNameTags,
  getFileNameWithoutTags,
  getFileParentPath
} from '../../../../../../utils/path-format'

export function getSelectedTags(filename, tags) {
  if (!filename) return null
  filename = getFileName(filename)
  let selectedTags = getFileNameTags(filename, { includedIn: tags })
  if (selectedTags.length < 1) selectedTags = null
  return selectedTags
}

export function getNewImageName(path, tags, selectedTags, { fullPath = false } = {}) {
  if (!path) return null
  const filename = getFileName(path)

  let parentPath = ''
  if (fullPath) parentPath = getFileParentPath(path)

  return (
    parentPath +
    addTagsToFileName(getFileNameWithoutTags(filename, { customTags: tags }), selectedTags)
  )
}

export async function getTagsFromFile(file) {
  if (!file) return null
  const tags = (await window.api.readTagFile(file) ?? []).filter(Boolean)
  return tags
}

export async function appendTag(file, tag) {
  return await window.api.appendTagToFile(file, tag)
}

export async function renameFile(oldPath, newPath) {
  newPath = await window.api.renameFile(oldPath, newPath)
  return newPath
}
