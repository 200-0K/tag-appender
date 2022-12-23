import { getSelectedTags, getTagsFromFile } from './filename'
import { getImages } from './images'
import { getProfiles } from './profiles'

export async function getPreference(onload) {
  const prefs = await window.api.getPreference()
  prefs.imgs = await getImages(prefs.dir) ?? []
  prefs.profiles = await getProfiles() ?? []
  prefs.currentProfile = prefs.profiles?.find((profile) => profile === prefs.currentProfile) ?? prefs.profiles?.[0]
  prefs.tags = await getTagsFromFile(prefs.currentProfile) ?? []
  if (prefs.imgs?.length > 0) {
    if (!prefs.imgs[prefs.currentImgIndex]) prefs.currentImgIndex = 0 // index out of bounds
  } else prefs.currentImgIndex = -1 // no images
  prefs.selectedTags = getSelectedTags(prefs.imgs?.[prefs.currentImgIndex], prefs.tags) ?? []

  onload?.(prefs)
  return prefs
}