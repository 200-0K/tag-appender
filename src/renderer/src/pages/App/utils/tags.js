import { getFileWithoutExtension } from '../../../../../../utils/path-format'

export async function getImageTags(imagepath) {
  if (!imagepath) return null
  const filepath = getFileWithoutExtension(imagepath) + ".txt"
  const tags = await getTagsFromFile(filepath)
  return tags
}

export async function putTagsToImage(imagepath, tags) {
  if (!imagepath) return null
  return await window.api.writeTagsToFile(getFileWithoutExtension(imagepath) + ".txt", tags)
}

export async function moveImage(imagepath, newLocation) {
  if (!imagepath || !newLocation) return null
  
  const newImagePath = await window.api.moveFile(imagepath, newLocation)
  if ( (await getImageTags(imagepath)) != undefined ) {
    await window.api.moveFile(getFileWithoutExtension(imagepath) + ".txt", newLocation)
  }

  return newImagePath
}

export async function getTagsFromFile(filepath) {
  if (!filepath) return null
  let tags = await window.api.readTagFile(filepath)
  if (tags) tags = tags.filter(Boolean)
  return tags
}

export async function appendTag(filepath, tag) {
  return await window.api.appendTagToFile(filepath, tag)
}