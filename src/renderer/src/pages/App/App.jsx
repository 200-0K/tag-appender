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
  const [loadingMediaTags, setLoadingMediaTags] = useState(true) // for auto tagging
  const [dir, setDir] = useState(null)
  const [currentMediaIndex, setCurrentMediaIndex] = useState(null)
  const [currentMediaPath, setCurrentMediaPath] = useState(null)
  const [currentProfile, setCurrentProfile] = useState(null)
  const [moveLocation, setMoveLocation] = useState(null)
  const [autotagScript, setAutotagScript] = useState(null)
  const [medias, setMedias] = useState([])
  const [profiles, setProfiles] = useState([])
  const [tags, setTags] = useState([])
  const [mediaTags, setMediaTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])

  // init
  useEffect(() => {
    const init = async () => {
      const { dir, currentMediaPath, currentProfile, moveLocation, autotagScript } =
        await window.api.getPreference()
      const profiles = (await getProfiles()) ?? []
      setDir(dir)
      setCurrentMediaIndex(currentMediaIndex)
      setCurrentMediaPath(currentMediaPath)
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
      .updatePreference({ dir, currentMediaPath, currentProfile, moveLocation, autotagScript })
      .catch(console.error)
  }, [dir, currentMediaPath, currentProfile, moveLocation, autotagScript])

  // directory changed
  const loadDir = (dir, { resetIndex = false } = {}) => {
    getImages(dir)
      .then((newMedias) => {
        let index = newMedias.findIndex((media) => media === currentMediaPath)
        if (resetIndex) index = 0
        if (newMedias.length > 0) {
          if (index == -1) index = 0
        } else index = null // there are no images
        setCurrentMediaIndex(index)

        setMedias(newMedias ?? [])
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
  const loadMediaTags = () => {
    setLoadingMediaTags(true)
    getImageTags(medias[currentMediaIndex]).then((mediaTags) => {
      mediaTags = mediaTags ?? []
      setMediaTags(mediaTags)
      const newSelectedTags = [...new Set([...selectedTags.filter((tag) => tags.includes(tag)), ...mediaTags])]
      setSelectedTags(newSelectedTags)
      setLoadingMediaTags(false)
    })
  }
  useEffect(() => {
    setCurrentMediaPath(medias[currentMediaIndex])
    if (!medias[currentMediaIndex]) return
    loadMediaTags()
  }, [currentMediaIndex, medias])

  const mediaPath = currentMediaPath
  return (
    !loadingPrefs && (
      <div className="flex flex-col h-screen text-xs">
        <header className="flex gap-4 px-4 py-2 w-full">
          {/* dir stats */}
          <aside className="grid grid-cols-2 justify-items-center uppercase">
            <p>Total</p>
            <p>{medias.length}</p>
            <p>Remaining</p>
            <p>{medias.length && medias.length - (currentMediaIndex + 1)}</p>
          </aside>

          {/* directory picker */}
          <FileBrowser
            dir={dir}
            onDirChange={(newDir) => {
              if (newDir === dir) {
                loadDir(newDir)
              } else {
                setDir(newDir)
                setCurrentMediaIndex(0)
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
            imagePath={mediaPath}
            allowNext={currentMediaIndex + 1 < medias.length}
            allowPrev={currentMediaIndex - 1 > -1}
            onNext={() => setCurrentMediaIndex(currentMediaIndex + 1)}
            onPrev={() => setCurrentMediaIndex(currentMediaIndex - 1)}
            disabled={loadingMediaTags}
            buttonText="Tag"
            onButtonClick={async (mediaPath) => {
              if (mediaTags.length > 0 || selectedTags.length > 0)
                await putTagsToImage(mediaPath, selectedTags.sort())

              if (moveLocation) {
                const newMediaPath = await moveImage(mediaPath, moveLocation)
                setMedias(medias.map((media) => (media === mediaPath ? newMediaPath : media)))
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
              <button onClick={() => setSelectedTags([...new Set(mediaTags)])}>
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
                  mediaTags.includes(tag) ? { value: tag, color: 'green' } : tag
                ),
                ...mediaTags
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
              <BounceLoader color="#4b5563" loading={loadingMediaTags} size={30} />
            </div>

            <ExternalScriptButton
              script={autotagScript}
              setScript={setAutotagScript}
              args={[`"${mediaPath}"`]}
              onScriptStart={() => setLoadingMediaTags(true)}
              onScriptEnd={() => loadMediaTags()}
              disabled={loadingMediaTags}
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
