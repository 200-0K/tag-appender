import { useState, useEffect } from 'react'

import FileBrowser from '../../components/FileBrowser'
import { cn } from './utils/cn'
import InputText from '../../components/InputText'
import SelectableList from '../../components/SelectableList'
import MediaViewer from '../../components/mediaViewer'
import Toggle from '../../components/Toggle'
import ProfileList from '../../components/ProfileList/ProfileList'

// reset icon replaced by Tabler icon for theme-aware rendering

import { getTagsFromFile, appendTag, putTagsToFile, moveMedia } from './utils/tags'
import { getMedias } from './utils/medias'
import { getProfiles } from './utils/profiles'
import { createProfileData } from './utils/profile-defaults'
import { directoryPicker } from '../../utils/pickers'
import BounceLoader from 'react-spinners/BounceLoader'
import ExternalScriptButton from '../../components/ExternalScriptButton/ExternalScriptButton'
import { humanFileSize } from './utils/bytes'
import { IconCheck, IconSun, IconMoon, IconRefresh, IconFolder, IconFolderSymlink, IconArrowRight, IconArrowLeft, IconFolderBolt, IconFolderShare } from '@tabler/icons-react'
import { inLocation, getFileParentPath } from '../../../../../utils/path-format'

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
  const [groups, setGroups] = useState([])
  const [mediaTags, setMediaTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [movedHistory, setMovedHistory] = useState({}) // { newPath: originalPath }

  // Theme state: default to dark; persisted in localStorage
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') ?? 'dark'
    } catch (e) {
      return 'dark'
    }
  })

  useEffect(() => {
    try {
      if (theme === 'dark') document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', theme)
    } catch (e) {
      // ignore
    }
  }, [theme])

  // init
  useEffect(() => {
    const init = async () => {
      let { dir, currentMediaPath, currentProfile, moveLocation, autotagScript } =
        await window.api.getPreference()

      // Migration logic: convert CSV .ta to JSON .ta
      const taProfiles = (await window.api.profileScanner()) ?? []
      for (const taProfile of taProfiles) {
        const taPath = taProfile.path
        try {
          const data = await window.api.readJsonFile(taPath)
          if (!data || !data.tags) throw new Error('Not JSON')
        } catch (e) {
          // Not JSON, convert CSV to JSON
          const taTags = await window.api.readTagFile(taPath)
          if (taTags) {
            const profileData = createProfileData(taTags.filter(Boolean))
            await window.api.writeJsonFile(taPath, profileData)
          }
        }
      }

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
    getMedias(dir)
      .then((newMedias) => {
        let index = newMedias.findIndex((media) => media.path === currentMediaPath)
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
      .then((data) => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setTags(data.tags ?? [])
          setGroups(data.groups ?? [])
        } else {
          setTags(data ?? [])
          setGroups([])
        }
      })
      .catch(console.error)
    setSelectedTags([])
    if (medias[currentMediaIndex]) loadMediaTags()
  }, [currentProfile])

  // update selected tags
  const loadMediaTags = () => {
    setLoadingMediaTags(true)
    getTagsFromFile(medias[currentMediaIndex].path, { tagFileExt: 'txt' }).then((mediaTags) => {
      mediaTags = mediaTags ?? []
      setMediaTags(mediaTags)
      const newSelectedTags = [
        ...new Set([...selectedTags.filter((tag) => tags.some((t) => t.name === tag)), ...mediaTags])
      ]
      setSelectedTags(newSelectedTags)
      setLoadingMediaTags(false)
    })
  }
  useEffect(() => {
    setCurrentMediaPath(medias[currentMediaIndex]?.path)
    if (!medias[currentMediaIndex]) return
    loadMediaTags()
  }, [currentMediaIndex, medias])

  const undoMove = async (currentPath) => {
    const originalPath = movedHistory[currentPath]
    if (!originalPath) return

    const movedBackPath = await moveMedia(currentPath, getFileParentPath(originalPath))
    if (!movedBackPath) return

    setMedias(
      medias.map((media) =>
        media.path === currentPath ? { ...media, path: movedBackPath } : media
      )
    )
    setMovedHistory((prev) => {
      const newHistory = { ...prev }
      delete newHistory[currentPath]
      return newHistory
    })
  }

  const handleReorder = (newTags, newGroups) => {
    setTags(newTags)
    if (newGroups) setGroups(newGroups)
    putTagsToFile(currentProfile, newTags, { groups: newGroups ?? groups }).catch(console.error)
  }

  const mediaPath = currentMediaPath
  return (
    !loadingPrefs && (
      <div
        className={cn(
          'flex flex-col h-screen text-xs',
          theme === 'dark' ? 'bg-surface text-slate-200' : 'bg-slate-50 text-slate-900'
        )}
      >
        <header className="flex gap-4 px-4 py-2 w-full items-center bg-slate-900/40 border-b border-slate-800 text-slate-900 dark:text-slate-200">
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
        </header>

        <main className={'flex-1 flex overflow-hidden px-4 py-1'}>
          {/* Image Viewer & Controller */}
          <MediaViewer
            key={`${medias[currentMediaIndex]}`}
            className={'flex-1'}
            mediaPath={mediaPath}
            mediaType={medias[currentMediaIndex]?.type}
            mediaMeta={medias[currentMediaIndex] && [
              `${medias[currentMediaIndex].type}`,
              `${humanFileSize(medias[currentMediaIndex].size)}`,
              // `${medias[currentMediaIndex].dimensions?.width}x${medias[currentMediaIndex].dimensions?.height}` //TODO: fix dimension reading
            ]}
            allowNext={currentMediaIndex + 1 < medias.length}
            allowPrev={currentMediaIndex - 1 > -1}
            onNext={() => setCurrentMediaIndex(currentMediaIndex + 1)}
            onPrev={() => setCurrentMediaIndex(currentMediaIndex - 1)}
            disabled={loadingMediaTags}
            buttonText="Tag"
            onButtonClick={async (mediaPath) => {
              if (mediaTags.length > 0 || selectedTags.length > 0)
                await putTagsToFile(mediaPath, selectedTags.sort(), { tagFileExt: 'txt' })

              if (moveLocation) {
                const originalPath = mediaPath
                const newMediaPath = await moveMedia(mediaPath, moveLocation)
                if (!newMediaPath) return

                if (newMediaPath !== originalPath) {
                  setMovedHistory((prev) => ({ ...prev, [newMediaPath]: originalPath }))
                }
                setMedias(
                  medias.map((media) =>
                    media.path === mediaPath ? { ...media, path: newMediaPath } : media
                  )
                )
              }
            }}
            undoButtonText="Undo"
            onUndoClick={() => undoMove(mediaPath)}
            canUndo={inLocation(mediaPath, moveLocation, { level: 0 }) && !!movedHistory[mediaPath]}
            statusHtml={
              inLocation(mediaPath, moveLocation, { level: 0 }) ? <IconCheck color="green" /> : null
            }
          />

          {/* Right Section */}
          <div className="flex flex-col gap-2 w-56 select-none">
            {/* Action Icons and Media Meta */}
            <div className='flex p-1 gap-2 justify-between'>
              <div></div>

              <div className='flex gap-2'>
                {/* move tagged images: folder icon button */}
                <div>
                  <button
                    type="button"
                    aria-pressed={!!moveLocation}
                    title={
                      moveLocation
                        ? `Move tagged medias\n\nTarget: ${moveLocation}`
                        : "Move tagged medias: click to choose destination"
                    }
                    onClick={async () => {
                      if (moveLocation) {
                        setMoveLocation(null)
                      } else {
                        const newMoveLocation = await directoryPicker()
                        if (!newMoveLocation) return
                        setMoveLocation(newMoveLocation)
                      }
                    }}
                    className={cn(
                      "relative",
                      moveLocation
                        ? "text-slate-900 dark:text-slate-100 opacity-100 hover:opacity-90"
                        : [
                          "text-slate-500 dark:text-slate-500 opacity-50 hover:opacity-70",
                          // slash overlay
                          'after:content-[""] after:absolute after:left-0.5 after:right-0.5 after:top-1/2',
                          "after:h-px after:bg-current after:-rotate-45 after:pointer-events-none",
                        ].join(" ")
                    )}
                  >
                    <IconFolderShare size={16} />
                  </button>
                </div>

                {/* Theme toggle */}
                <div>
                  <button
                    title="Toggle theme"
                    onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
                  >
                    {theme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className='flex'>
              <ProfileList
                profiles={profiles}
                currentProfile={currentProfile}
                setProfiles={setProfiles}
                setCurrentProfile={setCurrentProfile}
                className="flex-1"
              />
              <button
                onClick={() => setSelectedTags([...new Set(mediaTags)])}
                title="Reset Selected Tags"
                className="p-1.5 rounded-md hover:bg-slate-200/30 dark:hover:bg-slate-700/40 text-slate-900 dark:text-slate-200"
              >
                <IconRefresh size={18} />
              </button>
            </div>


            {/* Tag List */}
            <SelectableList
              tags={tags}
              groups={groups}
              mediaTags={mediaTags}
              selectedItems={selectedTags}
              onSelect={(tag, { checked, ctrlKey }) =>
                setSelectedTags((tags) => {
                  let oldSelectedTags = tags
                  if (!ctrlKey) oldSelectedTags = []
                  if (checked) return [...oldSelectedTags, tag]
                  else return [...oldSelectedTags.filter((oldTag) => oldTag !== tag)]
                })
              }
              onReorder={handleReorder}
              className="flex-1 p-1"
            />

            <div className="self-center">
              <BounceLoader color="#4b5563" loading={loadingMediaTags} size={30} />
            </div>

            {/* Tag Input */}
            <div className="flex gap-2">
              <InputText
                placeholder="New Tag"
                onValueEnter={async (newTag, e) => {
                  if (await appendTag(currentProfile, newTag)) {
                    setTags([...tags, { name: newTag }])
                    e.target.value = ''
                  }
                }}
                disabled={!currentProfile}
                className="flex-1"
              />
            </div>

            {/* Group Input */}
            <div className="flex gap-2">
              <InputText
                placeholder="New Group"
                onValueEnter={(newGroup, e) => {
                  if (newGroup && !groups.find((g) => g.name === newGroup)) {
                    const newGroups = [...groups, { id: Date.now().toString(), name: newGroup }]
                    setGroups(newGroups)
                    putTagsToFile(currentProfile, tags, { groups: newGroups }).catch(console.error)
                    e.target.value = ''
                  }
                }}
                disabled={!currentProfile}
                className="flex-1"
              />
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
