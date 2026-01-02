import { useState, useEffect, useCallback } from 'react'
import Swal from 'sweetalert2'

import FileBrowser from '../../components/FileBrowser'
import { cn } from './utils/cn'
import InputText from '../../components/InputText'
import SelectableList from '../../components/SelectableList'
import MediaViewer from '../../components/mediaViewer'
import Toggle from '../../components/Toggle'
import ProfileList from '../../components/ProfileList/ProfileList'
import WorkspaceSelector from '../../components/WorkspaceSelector'

import { getTagsFromFile, appendTag, putTagsToFile, moveMedia } from './utils/tags'
import { getMedias } from './utils/medias'
import { getProfiles } from './utils/profiles'
import { createProfileData } from './utils/profile-defaults'
import { directoryPicker } from '../../utils/pickers'
import BounceLoader from 'react-spinners/BounceLoader'
import ExternalScriptButton from '../../components/ExternalScriptButton/ExternalScriptButton'
import { humanFileSize } from './utils/bytes'
import { IconCheck, IconSun, IconMoon, IconRefresh, IconFolder, IconFolderSymlink, IconArrowRight, IconArrowLeft, IconFolderBolt, IconFolderShare, IconCloudDownload } from '@tabler/icons-react'
import { inLocation, getFileParentPath } from '../../../../../utils/path-format'

// ✅ PREFETCH: new imports
import { imageCache } from '../../media/imageCache'
import { imagePrefetcher } from '../../media/imagePrefetcher'

function App() {
  const [loadingPrefs, setLoadingPrefs] = useState(true)
  const [switchingWorkspace, setSwitchingWorkspace] = useState(false)
  const [loadingMediaTags, setLoadingMediaTags] = useState(true) // for auto tagging
  const [dir, setDir] = useState(null)
  const [currentMediaIndex, setCurrentMediaIndex] = useState(null)
  const [currentMediaPath, setCurrentMediaPath] = useState(null)
  const [currentProfile, setCurrentProfile] = useState(null)
  const [moveLocation, setMoveLocation] = useState(null)
  const [autotagScript, setAutotagScript] = useState(null)
  const [medias, setMedias] = useState([])
  const [profiles, setProfiles] = useState([])
  const [workspaces, setWorkspaces] = useState([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null)
  const [tags, setTags] = useState([])
  const [groups, setGroups] = useState([])
  const [mediaTags, setMediaTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [movedHistory, setMovedHistory] = useState({}) // { newPath: originalPath }
  const [navDir, setNavDir] = useState(1)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [appVersion, setAppVersion] = useState('')

  const clampIndex = (i) => {
    if (!medias || medias.length === 0) return null
    return Math.max(0, Math.min(medias.length - 1, i))
  }

  const handleNav = (delta, e) => {
    setNavDir(delta > 0 ? 1 : -1)
    const step = e?.ctrlKey ? delta * 5 : delta
    setCurrentMediaIndex((idx) => {
      if (idx === null) return idx
      return clampIndex(idx + step)
    })
  }

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
      const { workspaces, activeWorkspaceId, migrated } = await window.api.getWorkspaces()
      setWorkspaces(workspaces)
      setActiveWorkspaceId(activeWorkspaceId)

      if (migrated) {
        Swal.fire({
          title: 'Preferences Migrated',
          text: 'Your existing settings have been moved to the "Default" workspace.',
          icon: 'info',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 5000,
          timerProgressBar: true
        })
      }

      let { dir, currentMediaPath, currentProfile, moveLocation, autotagScript } =
        await window.api.getPreference()

      const taProfiles = (await window.api.profileScanner()) ?? []
      for (const taProfile of taProfiles) {
        const taPath = taProfile.path
        try {
          const data = await window.api.readJsonFile(taPath)
          if (!data || !data.tags) throw new Error('Not JSON')
        } catch (e) {
          const taTags = await window.api.readTagFile(taPath)
          if (taTags) {
            const profileData = createProfileData(taTags.filter(Boolean))
            await window.api.writeJsonFile(taPath, profileData)
          }
        }
      }

      const profiles = (await getProfiles()) ?? []
      const version = await window.api.getAppVersion()
      setAppVersion(version)
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

  useEffect(() => {
    if (!window.api.onUpdateStatus) return

    const removeListener = window.api.onUpdateStatus((status, data) => {
      switch (status) {
        case 'checking-for-update':
          setCheckingUpdate(true)
          break
        case 'update-available':
          Swal.fire({
            title: 'Update available, downloading...',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            icon: 'info'
          })
          break
        case 'update-not-available':
          setCheckingUpdate(false)
          Swal.fire({
            title: 'Up to date',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            icon: 'success'
          })
          break
        case 'error':
          setCheckingUpdate(false)
          Swal.fire({
            title: 'Update Error',
            text: data.error,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 5000,
            icon: 'error'
          })
          break
        case 'update-downloaded':
          setCheckingUpdate(false)
          Swal.fire({
            title: 'Update Downloaded',
            text: 'Restart now to install?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Restart',
            cancelButtonText: 'Later'
          }).then((result) => {
            if (result.isConfirmed) {
              window.api.quitAndInstall()
            }
          })
          break
      }
    })

    return () => {
      if (removeListener) removeListener()
    }
  }, [])

  const handleWorkspaceChange = async (id) => {
    setSwitchingWorkspace(true)
    setLoadingPrefs(true)

    // ✅ PREFETCH: clear cache + abort prefetch on workspace switch
    imagePrefetcher.clear()
    imageCache.clear()

    // Clear current state to avoid stale data during transition
    setMedias([])
    setCurrentMediaIndex(null)
    setCurrentMediaPath(null)
    setTags([])
    setGroups([])
    setMediaTags([])
    setSelectedTags([])
    setMovedHistory({})

    const workspace = await window.api.switchWorkspace(id)
    if (workspace) {
      setActiveWorkspaceId(id)
      setDir(workspace.dir)
      setCurrentMediaPath(workspace.currentMediaPath)
      setMoveLocation(workspace.moveLocation)
      setAutotagScript(workspace.autotagScript)

      const profiles = (await getProfiles()) ?? []
      setProfiles(profiles)
      const newProfile = profiles.find((p) => p === workspace.currentProfile) ?? profiles[0]
      setCurrentProfile(newProfile)

      if (newProfile) {
        try {
          const data = await getActionableTagsFromProfile(newProfile)
          setTags(data.tags)
          setGroups(data.groups)
        } catch (error) {
          console.error('Error loading tags:', error)
        }
      }
    }

    setTimeout(() => {
      setLoadingPrefs(false)
      setSwitchingWorkspace(false)
    }, 300)
  }

  // small helper (keeps your existing behavior)
  async function getActionableTagsFromProfile(profilePath) {
    const data = await getTagsFromFile(profilePath)
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return { tags: data.tags ?? [], groups: data.groups ?? [] }
    }
    return { tags: data ?? [], groups: [] }
  }

  const handleWorkspaceCreate = async (name) => {
    const newWorkspace = await window.api.createWorkspace(name)
    if (newWorkspace) {
      const { workspaces, activeWorkspaceId } = await window.api.getWorkspaces()
      setWorkspaces(workspaces)
      handleWorkspaceChange(activeWorkspaceId)
    }
  }

  const handleWorkspaceDelete = async (id) => {
    const success = await window.api.deleteWorkspace(id)
    if (success) {
      const { workspaces, activeWorkspaceId } = await window.api.getWorkspaces()
      setWorkspaces(workspaces)
      handleWorkspaceChange(activeWorkspaceId)
    }
  }

  // save preferences
  useEffect(() => {
    if (loadingPrefs || switchingWorkspace) return
    window.api
      .updatePreference({ dir, currentMediaPath, currentProfile, moveLocation, autotagScript })
      .catch(console.error)
  }, [dir, currentMediaPath, currentProfile, moveLocation, autotagScript, loadingPrefs, switchingWorkspace])

  // directory changed
  const loadDir = (dir, { resetIndex = false } = {}) => {
    getMedias(dir)
      .then((newMedias) => {
        let index = newMedias.findIndex((media) => media.path === currentMediaPath)
        if (resetIndex) index = 0
        if (newMedias.length > 0) {
          if (index == -1) index = 0
        } else index = null
        setCurrentMediaIndex(index)
        setMedias(newMedias ?? [])
      })
      .catch(console.error)
  }

  useEffect(() => {
    if (!dir) return
    // ✅ PREFETCH: clear cache + abort when directory changes
    imagePrefetcher.clear()
    imageCache.clear()
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

  // ✅ PREFETCH: preload neighbors whenever index changes
  useEffect(() => {
    if (currentMediaIndex == null) return
    if (!medias || medias.length === 0) return
    const cur = medias[currentMediaIndex]
    if (cur?.path) imageCache.touch(cur.path)

    imagePrefetcher.prefetchAround({
      medias,
      index: currentMediaIndex,
      radius: 6,
      skipAboveBytes: 250 * 1024 * 1024
    })

    const extra = []
    for (let i = 1; i <= 12; i++) {
      const m = medias[currentMediaIndex + navDir * i]
      if (m?.path && (m.type || '').toLowerCase().startsWith('image')) extra.push(m.path)
    }
    imagePrefetcher.prefetchPaths(extra)
  }, [currentMediaIndex, medias])

  const undoMove = async (currentPath) => {
    const originalPath = movedHistory[currentPath]
    if (!originalPath) return

    const movedBackPath = await moveMedia(currentPath, getFileParentPath(originalPath))
    if (!movedBackPath) return

    setMedias((prev) =>
      prev.map((m) => (m.path === currentPath ? { ...m, path: movedBackPath } : m))
    )
    setMovedHistory((prev) => {
      const newHistory = { ...prev }
      delete newHistory[currentPath]
      return newHistory
    })

    // ✅ Keep blob valid through undo (and avoid emit-race)
    if (imageCache.hasDecoded(currentPath)) {
      imageCache.rename(currentPath, movedBackPath, { emitNow: false })
    } else {
      imageCache.delete(currentPath)
    }

    // Optional cleanup: only delete the "other" key if it's different
    if (originalPath && originalPath !== movedBackPath) {
      imageCache.delete(originalPath)
    }
  }

  const handleReorder = (newTags, newGroups) => {
    setTags(newTags)
    if (newGroups) setGroups(newGroups)
    putTagsToFile(currentProfile, newTags, { groups: newGroups ?? groups }).catch(console.error)
  }

  const handleMediaLoaded = useCallback(
    (dimensions) => {
      setMedias((prevMedias) => {
        const currentMedia = prevMedias[currentMediaIndex]
        if (!currentMedia) return prevMedias

        if (
          currentMedia.dimensions?.width === dimensions.width &&
          currentMedia.dimensions?.height === dimensions.height
        )
          return prevMedias

        const newMedias = [...prevMedias]
        newMedias[currentMediaIndex] = { ...currentMedia, dimensions }
        return newMedias
      })
    },
    [currentMediaIndex]
  )

  const mediaPath = currentMediaPath
  return (
    <div
      className={cn(
        'flex flex-col h-screen text-xs relative overflow-hidden',
        theme === 'dark' ? 'bg-surface text-slate-200' : 'bg-slate-50 text-slate-900'
      )}
    >
      <div
        className={cn(
          'absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm transition-opacity duration-300 pointer-events-none opacity-0',
          (switchingWorkspace || loadingPrefs) && 'opacity-100 pointer-events-auto'
        )}
      >
        <BounceLoader color="#3b82f6" size={60} />
        <p className="mt-4 text-lg font-medium text-white">
          {switchingWorkspace ? 'Switching Workspace...' : 'Loading...'}
        </p>
      </div>

      {!loadingPrefs && (
        <>
          <header className="flex gap-4 px-4 py-2 w-full items-center bg-slate-900/40 border-b border-slate-800 text-slate-900 dark:text-slate-200">
            <aside className="grid grid-cols-2 justify-items-center uppercase">
              <p>Total</p>
              <p>{medias.length}</p>
              <p>Remaining</p>
              <p>{medias.length && medias.length - (currentMediaIndex + 1)}</p>
            </aside>

            <FileBrowser
              dir={dir}
              onDirChange={(newDir) => {
                if (newDir === dir) {
                  // reload same dir
                  imagePrefetcher.clear()
                  imageCache.clear()
                  loadDir(newDir)
                } else {
                  setDir(newDir)
                  setCurrentMediaIndex(0)
                }
              }}
              className="flex-1"
            />

            <button
              onClick={() => window.api.checkForUpdates()}
              disabled={checkingUpdate}
              className={cn(
                'p-2 rounded-full transition-colors',
                checkingUpdate
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
              title={`Check for updates (current: ${appVersion})`}
            >
              {checkingUpdate ? (
                <IconRefresh className="animate-spin" size={20} />
              ) : (
                <IconCloudDownload size={20} />
              )}
            </button>
          </header>

          <main className={'flex-1 flex overflow-hidden px-4 py-1'}>
            <MediaViewer
              className={'flex-1'}
              mediaPath={mediaPath}
              mediaType={medias[currentMediaIndex]?.type}
              mediaMeta={
                medias[currentMediaIndex] && [
                  <span key="created" title={new Date(medias[currentMediaIndex].created).toLocaleString()}>
                    {`C: ${new Date(medias[currentMediaIndex].created).toLocaleDateString()}`}
                  </span>,
                  <span key="modified" title={new Date(medias[currentMediaIndex].modified).toLocaleString()}>
                    {`M: ${new Date(medias[currentMediaIndex].modified).toLocaleDateString()}`}
                  </span>,
                  `${medias[currentMediaIndex].type}`,
                  <span
                    key="size"
                    className={cn(
                      medias[currentMediaIndex].size < 1024 * 1024
                        ? 'text-green-500'
                        : medias[currentMediaIndex].size < 10 * 1024 * 1024
                          ? 'text-yellow-500'
                          : 'text-red-500'
                    )}
                  >
                    {humanFileSize(medias[currentMediaIndex].size)}
                  </span>,
                  medias[currentMediaIndex].dimensions
                    ? `${medias[currentMediaIndex].dimensions.width}x${medias[currentMediaIndex].dimensions.height}`
                    : '...'
                ]
              }
              allowNext={currentMediaIndex + 1 < medias.length}
              allowPrev={currentMediaIndex - 1 > -1}
              onNext={(e) => handleNav(1, e)}
              onPrev={(e) => handleNav(-1, e)}
              disabled={loadingMediaTags}
              buttonText="Tag"
              onMediaLoaded={handleMediaLoaded}
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
                  setMedias((prev) =>
                    prev.map((m) => (m.path === originalPath ? { ...m, path: newMediaPath } : m))
                  )


                  // ✅ Preserve decoded blob cache when moving the same file
                  // IMPORTANT: silent rename avoids cache "emit" re-render BEFORE medias/current path update
                  if (imageCache.hasDecoded(originalPath)) {
                    imageCache.rename(originalPath, newMediaPath, { emitNow: false })
                  } else {
                    imageCache.delete(originalPath)
                  }
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
              <div className="flex p-1 gap-2 justify-between">
                <div></div>

                <div className="flex gap-2">
                  <div>
                    <button
                      type="button"
                      aria-pressed={!!moveLocation}
                      title={
                        moveLocation
                          ? `Move tagged medias\n\nTarget: ${moveLocation}`
                          : 'Move tagged medias: click to choose destination'
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
                        'relative',
                        moveLocation
                          ? 'text-slate-900 dark:text-slate-100 opacity-100 hover:opacity-90'
                          : [
                            'text-slate-500 dark:text-slate-500 opacity-50 hover:opacity-70',
                            'after:content-[""] after:absolute after:left-0.5 after:right-0.5 after:top-1/2',
                            'after:h-px after:bg-current after:-rotate-45 after:pointer-events-none'
                          ].join(' ')
                      )}
                    >
                      <IconFolderShare size={16} />
                    </button>
                  </div>

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

              <div className="flex flex-col gap-2">
                <WorkspaceSelector
                  workspaces={workspaces}
                  activeWorkspaceId={activeWorkspaceId}
                  onWorkspaceChange={handleWorkspaceChange}
                  onWorkspaceCreate={handleWorkspaceCreate}
                  onWorkspaceDelete={handleWorkspaceDelete}
                />
                <div className="flex">
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
              </div>

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
        </>
      )}
    </div>
  )
}

export default App
