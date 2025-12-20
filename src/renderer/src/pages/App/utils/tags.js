import { getFileWithoutExtension } from '../../../../../../utils/path-format'
import { createProfileData } from './profile-defaults'

export async function getTagsFromFile(filePath, { tagFileExt } = {}) {
  if (!filePath) return null
  filePath = tagFileExt ? getFileWithoutExtension(filePath) + `.${tagFileExt}` : filePath
  
  if (filePath.endsWith('.ta')) {
    const data = await window.api.readJsonFile(filePath)
    return { tags: data?.tags ?? [], groups: data?.groups ?? [] }
  }

  let tags = await window.api.readTagFile(filePath)
  if (tags) tags = tags.filter(Boolean)
  return tags
}

export async function putTagsToFile(filePath, tags, { groups, tagFileExt } = {}) {
  if (!filePath) return null
  filePath = tagFileExt ? getFileWithoutExtension(filePath) + `.${tagFileExt}` : filePath

  if (filePath.endsWith('.ta')) {
    return await window.api.writeJsonFile(filePath, createProfileData(tags, groups))
  }

  return await window.api.writeTagsToFile(filePath, tags)
}

export async function moveMedia(filePath, newPath) {
  if (!filePath || !newPath) return null

  const newMediaPath = await window.api.moveFile(filePath, newPath, { withSiblings: true })

  return newMediaPath
}

export async function appendTag(filePath, tag) {
  if (filePath.endsWith('.ta')) {
    const data = await window.api.readJsonFile(filePath)
    const tags = data?.tags ?? []
    const groups = data?.groups ?? []
    if (!tags.find(t => t.name === tag)) {
      tags.push({ name: tag })
      return await window.api.writeJsonFile(filePath, createProfileData(tags, groups))
    }
    return true
  }
  return await window.api.appendTagToFile(filePath, tag)
}
