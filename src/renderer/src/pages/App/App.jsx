import { useEffect, useState } from 'react'
import FileBrowser from '../../components/FileBrowser'
import InputText from '../../components/InputText'
import SelectableList from '../../components/SelectableList'
import ImageViewer from '../../components/ImageViewer'
import DropdownMenu from '../../components/DropdownMenu'

import { appendTag, getNewImageName, getSelectedTags, getTagsFromFile } from './utils/filename'
import { getImages } from './utils/images'
import { getProfiles } from './utils/profiles'
import { getFileName } from '../../../../../utils/path-format'

function App() {
  const [dir, setDir] = useState()
  const [imgs, setImgs] = useState([])
  const [currentImgIndex, setCurrentImgIndex] = useState(0)
  const [profiles, setProfiles] = useState([])
  const [currentProfile, setCurrentProfile] = useState(null)
  const [tags, setTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])

  // init
  const [doneInit, setDoneInit] = useState(false)
  useEffect(() => {
    const init = async () => {
      const { dir, currentImgIndex, currentProfile } = await window.api.getPreference()
      const profiles = await getProfiles()
      setDir(dir)
      setCurrentImgIndex(currentImgIndex)
      setCurrentProfile(currentProfile)
      setProfiles(profiles ?? [])
    }
    init()
      .then(() => setDoneInit(true)) //TODO: better solution?
      .catch(console.error)
  }, [])

  // save preferences
  useEffect(() => {
    if (!doneInit) return // to avoid overwriting preference file with default values
    window.api.updatePreference({ dir, currentImgIndex, currentProfile }).catch(console.error)
  }, [dir, currentImgIndex, currentProfile])

  // update images
  useEffect(() => {
    getImages(dir)
      .then((newImgs) => setImgs(newImgs ?? []))
      .catch(console.error)
  }, [dir])

  // update current profile
  useEffect(() => {
    setCurrentProfile(profiles.find((profile) => profile === currentProfile) ?? profiles[0])
  }, [profiles])

  // update tags
  useEffect(() => {
    getTagsFromFile(currentProfile)
      .then((newTags) => setTags(newTags ?? []))
      .catch(console.error)
  }, [currentProfile])

  // update current index
  useEffect(() => {
    let newIndex = currentImgIndex
    if (imgs.length > 0) {
      if (!imgs[currentImgIndex]) newIndex = 0 // index out of bounds
    } else newIndex = -1 // no images
    setCurrentImgIndex(newIndex)
  }, [imgs])

  // update selected tags
  useEffect(() => {
    setSelectedTags(getSelectedTags(imgs[currentImgIndex], tags) ?? [])
  }, [tags, currentImgIndex])

  const imagePath = imgs[currentImgIndex]
  return (
    <div className="flex flex-col h-screen text-xs">
      <header className="flex gap-4 px-4 py-2 w-full">
        {/* Dir Stats */}
        <aside className="grid grid-cols-2 justify-items-center uppercase">
          <p>Total</p>
          <p>{imgs.length}</p>
          <p>Remaining</p>
          <p>{imgs.length && imgs.length - (currentImgIndex + 1)}</p>
        </aside>

        {/* Directory Picker */}
        <FileBrowser
          dir={dir}
          onDirChange={(newDir) => {
            setDir(newDir)
            setCurrentImgIndex(0)
          }}
        />
      </header>

      <main className="flex-1 flex overflow-hidden px-4 pb-2">
        {/* Image Viewer & Controller */}
        <ImageViewer
          className={'flex-1'}
          imagePath={imagePath}
          newImagePath={getNewImageName(imagePath, tags, selectedTags, { fullPath: true })}
          allowNext={currentImgIndex + 1 < imgs.length}
          allowPrev={currentImgIndex - 1 > -1}
          onNext={() => setCurrentImgIndex(currentImgIndex + 1)}
          onPrev={() => setCurrentImgIndex(currentImgIndex - 1)}
          onRename={(newPath) =>
            setImgs((oldImgs) => oldImgs.map((img) => (img === imagePath ? newPath : img)))
          }
        />

        {/* Right Section */}
        <div className="flex flex-col gap-2 w-56 select-none">
          {/* Profile List */}
          <DropdownMenu
            items={profiles.map((profilePath) => ({
              value: profilePath,
              displayValue: getFileName(profilePath)
            }))}
            handleItemChange={(profilePath) => setCurrentProfile(profilePath)}
            selectedItem={currentProfile}
            title="Profile"
          />

          {/* Tag Input */}
          <InputText
            placeholder="Tag"
            onValueEnter={async (newTag, e) => {
              ;(await appendTag(currentProfile, newTag)) && setTags([...tags, newTag])
              e.target.value = ''
            }}
          />

          {/* Tag List */}
          <SelectableList
            items={tags}
            selectedItems={selectedTags}
            onSelect={(tag, { checked, ctrlKey }) =>
              setSelectedTags((tags) => {
                let oldSelectedTags = tags
                if (!ctrlKey) oldSelectedTags = []
                if (checked) return [...oldSelectedTags, tag]
                else return [...oldSelectedTags.filter((oldTag) => oldTag !== tag)]
              })
            }
            className="flex-1"
          />
        </div>
      </main>
    </div>
  )
}

export default App
