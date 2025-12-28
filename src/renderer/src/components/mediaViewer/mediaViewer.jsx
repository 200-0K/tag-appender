import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { getFileName } from '../../../../../utils/path-format'
import { IconEye } from '@tabler/icons-react'
import Button from '../Button'
import InputText from '../InputText'
import VideoJS, { getPlayer } from '../Videojs'

import { imageCache } from '../../media/imageCache'
import { toImgxUrl } from '../../media/imgxUrl'
import { BeatLoader } from 'react-spinners'

function useImageCacheVersion() {
  return useSyncExternalStore(
    (cb) => imageCache.subscribe(cb),
    () => imageCache.getSnapshot(),
    () => imageCache.getSnapshot()
  )
}

function isImageType(mediaType) {
  return (mediaType || '').toLowerCase().startsWith('image')
}

function resolveBestSrc(mediaPath, mediaType) {
  if (!mediaPath) return undefined
  if (isImageType(mediaType)) {
    const entry = imageCache.peek(mediaPath)
    if (entry?.decoded && entry.objectUrl) return entry.objectUrl // blob:
  }
  return toImgxUrl(mediaPath) // imgx:///
}

async function decodeBeforeSwap(src) {
  if (!src) return
  // If it's already blob: or cached by browser, this resolves quickly
  const img = new Image()
  img.decoding = 'async'
  img.src = src
  if (img.decode) {
    await img.decode()
  } else {
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
    })
  }
}

function MediaViewer({
  className,
  disabled = false,
  mediaPath,
  mediaType,
  mediaMeta = [],
  allowNext,
  allowPrev,
  onNext,
  onPrev,
  buttonText,
  onButtonClick,
  undoButtonText,
  onUndoClick,
  canUndo = false,
  statusHtml = null,
  onMediaLoaded
}) {
  const playerId = 'player'
  const isThereMedia = !!mediaPath
  const mediaName = isThereMedia && getFileName(mediaPath)

  // Re-render when cache changes so current media can become blob: instantly when available
  const _cacheVersion = useImageCacheVersion()

  // What we *want* to show right now (blob if present, else imgx)
  const desiredSrc = useMemo(() => resolveBestSrc(mediaPath, mediaType), [mediaPath, mediaType, _cacheVersion])

  // What we are *currently* showing (we keep old until new is decoded to avoid flicker)
  const [displaySrc, setDisplaySrc] = useState(desiredSrc)
  const [loadingSwap, setLoadingSwap] = useState(false)

  // Track latest swap request to avoid races when user navigates fast
  const swapTokenRef = useRef(0)

  // Badge: cache HIT if blob url is available for this mediaPath
  const cacheHit = isThereMedia && isImageType(mediaType) && imageCache.hasDecoded(mediaPath)

  useEffect(() => {
    if (!isImageType(mediaType)) {
      setDisplaySrc(desiredSrc)
      return
    }

    if (displaySrc === desiredSrc) return

    let cancelled = false
    const token = ++swapTokenRef.current

    const isBlob = typeof desiredSrc === 'string' && desiredSrc.startsWith('blob:')
    const shouldWaitForDecode = isBlob // only gate on blob hits

      ; (async () => {
        try {
          if (!shouldWaitForDecode) {
            // ✅ MISS: swap immediately (feels fast), browser decodes in background
            setDisplaySrc(desiredSrc)
            setLoadingSwap(true)
            return
          }

          // ✅ HIT: decode first to avoid flicker
          setLoadingSwap(true)
          await decodeBeforeSwap(desiredSrc)
          if (cancelled) return
          if (swapTokenRef.current === token) setDisplaySrc(desiredSrc)
        } catch {
          if (!cancelled && swapTokenRef.current === token) setDisplaySrc(desiredSrc)
        } finally {
          if (!cancelled && swapTokenRef.current === token) setLoadingSwap(false)
        }
      })()

    return () => {
      cancelled = true
    }
  }, [desiredSrc, mediaType])

  return (
    <div className={['flex flex-col gap-2 px-2', className].join(' ')}>
      <div className="flex flex-col gap-1">
        <div className="flex gap-2 items-center">
          {statusHtml}

          {canUndo && (
            <Button
              title={undoButtonText}
              className="uppercase py-2"
              disabled={disabled}
              onClick={() => onUndoClick?.(mediaPath)}
            >
              {undoButtonText}
            </Button>
          )}

          <InputText
            className="flex-1"
            value={mediaName || 'None'}
            disabled={!isThereMedia}
            title={mediaPath}
            readOnly
          />

          <Button
            title="Open externally"
            disabled={!isThereMedia}
            onClick={() => window.api.openFile(mediaPath)}
            className="px-2"
            variant="secondary"
          >
            <IconEye size={18} />
          </Button>

          <div className="flex gap-2 text-slate-900 dark:text-slate-200 select-none">
            <Button
              title="Previous (Ctrl+Click to move 5)"
              className="py-2"
              disabled={disabled || !allowPrev}
              onClick={(e) => onPrev?.(e)}
            >
              &lt;
            </Button>
            <Button
              title={buttonText}
              className="uppercase py-2"
              disabled={disabled || !isThereMedia || loadingSwap}
              onClick={async () => {
                getPlayer(playerId)?.dispose()
                await onButtonClick?.(mediaPath)
                if (allowNext) onNext?.()
              }}
            >
              {buttonText}
            </Button>
            <Button
              title="Next (Ctrl+Click to move 5)"
              className="py-2"
              disabled={disabled || !allowNext}
              onClick={(e) => onNext?.(e)}
            >
              &gt;
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[.7rem] font-mono font-bold tracking-wider px-2 opacity-70">
          {/* ✅ Visible cache indicator */}
          {isImageType(mediaType) && isThereMedia && (
            <div
              className={[
                'px-2 py-1 rounded text-[10px] font-mono select-none',
                cacheHit ? 'bg-green-600/30 text-green-200' : 'bg-slate-600/30 text-slate-200'
              ].join(' ')}
              title={cacheHit ? 'Cache HIT (blob: URL in RAM)' : 'Cache MISS (loading from imgx://)'}
            >
              {cacheHit ? 'HIT' : 'MISS'}
            </div>
          )}
          {mediaMeta.map((meta, idx) => (
            <div key={idx}>{meta}</div>
          ))}
        </div>
      </div>

      <div className="h-full overflow-hidden select-none bg-slate-900 rounded-lg border border-slate-800 p-3 relative">
        {/* ✅ This <img> stays mounted; only src changes */}
        {isImageType(mediaType) ? (
          <>
            <img
              alt=""
              className="h-full object-contain mx-auto"
              src={displaySrc}
              draggable={false}
              decoding="async"
              loading="eager"
              fetchpriority="high"
              onLoad={(e) => {
                if (mediaPath) imageCache.touch(mediaPath)
                onMediaLoaded?.({ width: e.target.naturalWidth, height: e.target.naturalHeight })
              }}
              onError={() => {
                // Only purge cache if a blob hit failed (revoked/corrupt)
                if (displaySrc?.startsWith('blob:') && mediaPath) imageCache.delete(mediaPath)
              }}
            />
            {loadingSwap && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <BeatLoader className='opacity-15' />
              </div>
            )}
          </>
        ) : (mediaType?.toLowerCase().startsWith('video') || mediaType?.toLowerCase().startsWith('audio')) ? (
          <VideoJS
            key={displaySrc}
            options={{
              autoplay: true,
              controls: true,
              responsive: true,
              fluid: mediaType?.toLowerCase().startsWith('audio'),
              audioOnlyMode: mediaType?.toLowerCase().startsWith('audio'),
              fill: mediaType?.toLowerCase().startsWith('video'),
              sources: [{ src: displaySrc, type: mediaType }],
              id: playerId
            }}
            onReady={(player) => {
              const storedVolume = localStorage.getItem('video-volume')
              const storedMuted = localStorage.getItem('video-muted')

              if (storedVolume !== null) player.volume(parseFloat(storedVolume))
              if (storedMuted !== null) player.muted(storedMuted === 'true')

              player.on('volumechange', () => {
                localStorage.setItem('video-volume', player.volume())
                localStorage.setItem('video-muted', player.muted())
              })

              const triggerLoaded = () => {
                onMediaLoaded?.({ width: player.videoWidth(), height: player.videoHeight() })
              }
              if (player.readyState() >= 1) triggerLoaded()
              else player.one('loadedmetadata', triggerLoaded)
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

export default React.memo(MediaViewer)
