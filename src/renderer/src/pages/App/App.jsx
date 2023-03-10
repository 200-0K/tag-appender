import { useState, useEffect } from 'react'

import FileBrowser from '../../components/FileBrowser'
import InputText from '../../components/InputText'
import SelectableList from '../../components/SelectableList'
import ImageViewer from '../../components/ImageViewer'
import Toggle from '../../components/Toggle'
import ProfileList from '../../components/ProfileList/ProfileList'

import resetSvg from '../../assets/reset.svg'

import { getImageTags, getTagsFromFile, appendTag, putTagsToImage, moveImage } from './utils/tags'
import { getImages } from './utils/images'
import { getProfiles } from './utils/profiles'
import { directoryPicker } from '../../utils/pickers'
import BounceLoader from 'react-spinners/BounceLoader'
import ExternalScriptButton from '../../components/ExternalScriptButton/ExternalScriptButton'

function App() {
  const [loadingPrefs, setLoadingPrefs] = useState(true)
  const [loadingImageTags, setLoadingImageTags] = useState(true) // for auto tagging
  const [dir, setDir] = useState(null)
  const [currentImgIndex, setCurrentImgIndex] = useState(null)
  const [currentImgPath, setCurrentImgPath] = useState(null)
  const [currentProfile, setCurrentProfile] = useState(null)
  const [moveLocation, setMoveLocation] = useState(null)
  const [autotagScript, setAutotagScript] = useState(null)
  const [imgs, setImgs] = useState([])
  const [profiles, setProfiles] = useState([])
  const [tags, setTags] = useState([])
  const [imageTags, setImageTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])

  // init
  useEffect(() => {
    const init = async () => {
      const { dir, currentImgPath, currentProfile, moveLocation, autotagScript } =
        await window.api.getPreference()
      const profiles = (await getProfiles()) ?? []
      setDir(dir)
      setCurrentImgIndex(currentImgIndex)
      setCurrentImgPath(currentImgPath)
      setMoveLocation(moveLocation)
      setAutotagScript(autotagScript)
      setProfiles(profiles)
      setCurrentProfile(profiles.find((profile) => profile === currentProfile) ?? profiles[0])
      setLoadingPrefs(false)
    }
    init().catch(console.error)
  }, [])

  // save preferences
  useEffect(() => {
    if (loadingPrefs) return // to avoid overwriting preference file with default values
    window.api
      .updatePreference({ dir, currentImgPath, currentProfile, moveLocation, autotagScript })
      .catch(console.error)
  }, [dir, currentImgPath, currentProfile, moveLocation, autotagScript])

  // directory changed
  const loadDir = (dir, { resetIndex = false } = {}) => {
    getImages(dir)
      .then((newImgs) => {
        let index = newImgs.findIndex((img) => img === currentImgPath)
        if (resetIndex) index = 0
        if (newImgs.length > 0) {
          if (index == -1) index = 0
        } else index = null // there are no images
        setCurrentImgIndex(index)

        setImgs(newImgs ?? [])
      })
      .catch(console.error)
  }
  useEffect(() => {
    if (!dir) return
    loadDir(dir)
  }, [dir])

  // current profile changed
  useEffect(() => {
    if (!currentProfile) return
    getTagsFromFile(currentProfile)
      .then((newTags) => setTags(newTags ?? []))
      .catch(console.error)
  }, [currentProfile])

  // update selected tags
  const loadImageTags = () => {
    setLoadingImageTags(true)
    getImageTags(imgs[currentImgIndex]).then((imageTags) => {
      imageTags = imageTags ?? []
      setImageTags(imageTags)
      const newSelectedTags = [...new Set([...selectedTags.filter((tag) => tags.includes(tag)), ...imageTags])]
      setSelectedTags(newSelectedTags)
      setLoadingImageTags(false)
    })
  }
  useEffect(() => {
    setCurrentImgPath(imgs[currentImgIndex])
    if (!imgs[currentImgIndex]) return
    loadImageTags()
  }, [currentImgIndex, imgs])

  const imagePath = currentImgPath
  return (
    !loadingPrefs && (
      <div className="flex flex-col h-screen text-xs">
        <header className="flex gap-4 px-4 py-2 w-full">
          {/* dir stats */}
          <aside className="grid grid-cols-2 justify-items-center uppercase">
            <p>Total</p>
            <p>{imgs.length}</p>
            <p>Remaining</p>
            <p>{imgs.length && imgs.length - (currentImgIndex + 1)}</p>
          </aside>

          {/* directory picker */}
          <FileBrowser
            dir={dir}
            onDirChange={(newDir) => {
              if (newDir === dir) {
                loadDir(newDir)
              } else {
                setDir(newDir)
                setCurrentImgIndex(0)
              }
            }}
            className="flex-1"
          />

          {/* move tagged images toggle */}
          <Toggle
            text="Move"
            enabled={!!moveLocation}
            title={moveLocation}
            onDisable={() => setMoveLocation(null)}
            onEnable={async () => {
              const newMoveLocation = await directoryPicker()
              if (!newMoveLocation) return
              setMoveLocation(newMoveLocation)
            }}
          />
        </header>

        <main className={'flex-1 flex overflow-hidden px-4 pb-2'}>
          {/* Image Viewer & Controller */}
          <ImageViewer
            className={'flex-1'}
            imagePath={imagePath}
            allowNext={currentImgIndex + 1 < imgs.length}
            allowPrev={currentImgIndex - 1 > -1}
            onNext={() => setCurrentImgIndex(currentImgIndex + 1)}
            onPrev={() => setCurrentImgIndex(currentImgIndex - 1)}
            disabled={loadingImageTags}
            buttonText="Tag"
            onButtonClick={async (imagePath) => {
              if (imageTags.length > 0 || selectedTags.length > 0)
                await putTagsToImage(imagePath, selectedTags.sort())

              if (moveLocation) {
                const newImagePath = await moveImage(imagePath, moveLocation)
                setImgs(imgs.map((img) => (img === imagePath ? newImagePath : img)))
              }
            }}
          />

          {/* Right Section */}
          <div className="flex flex-col gap-2 w-56 select-none">
            <ProfileList
              profiles={profiles}
              currentProfile={currentProfile}
              setProfiles={setProfiles}
              setCurrentProfile={setCurrentProfile}
            />

            {/* Tag Input */}
            <div className="flex gap-2">
              <InputText
                placeholder="Tag"
                onValueEnter={async (newTag, e) => {
                  if (await appendTag(currentProfile, newTag)) {
                    setTags([...tags, newTag])
                    e.target.value = ''
                  }
                }}
                disabled={!currentProfile}
                className="flex-1"
              />
              <button onClick={() => setSelectedTags([...new Set(imageTags)])}>
                <img
                  src={resetSvg}
                  alt="Reset Selected Tags"
                  title="Reset Selected Tags"
                  className="w-6"
                />
              </button>
            </div>

            {/* Tag List */}
            <SelectableList
              items={[
                ...tags.map((tag) =>
                  imageTags.includes(tag) ? { value: tag, color: 'green' } : tag
                ),
                ...imageTags
                  .filter((tag) => !tags.includes(tag))
                  .map((tag) => ({ value: tag, color: 'yellow' }))
              ]}
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

            <div className="self-center">
              <BounceLoader color="#4b5563" loading={loadingImageTags} size={30} />
            </div>

            <ExternalScriptButton
              script={autotagScript}
              setScript={setAutotagScript}
              args={[`"${imagePath}"`]}
              onScriptStart={() => setLoadingImageTags(true)}
              onScriptEnd={() => loadImageTags()}
              disabled={loadingImageTags}
            >
              Auto Tagging
            </ExternalScriptButton>
          </div>
        </main>
      </div>
    )
  )
}

export default App
