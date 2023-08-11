import { getFileWithoutExtension } from '../../../../../../utils/path-format'

export async function getTagsFromFile(filePath, { tagFileExt } = {}) {
  if (!filePath) return null
  filePath = tagFileExt ? getFileWithoutExtension(filePath) + `.${tagFileExt}` : filePath
  let tags = await window.api.readTagFile(filePath)
  if (tags) tags = tags.filter(Boolean)
  return tags
}

export async function putTagsToFile(filePath, tags, { tagFileExt } = {}) {
  if (!filePath) return null
  filePath = tagFileExt ? getFileWithoutExtension(filePath) + `.${tagFileExt}` : filePath
  return await window.api.writeTagsToFile(filePath, tags)
}

export async function moveMedia(filePath, newPath) {
  if (!filePath || !newPath) return null

  const newMediaPath = await window.api.moveFile(filePath, newPath, { withSiblings: true })

  return newMediaPath
}

export async function appendTag(filePath, tag) {
  return await window.api.appendTagToFile(filePath, tag)
}
