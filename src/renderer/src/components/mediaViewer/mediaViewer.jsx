import React, { useEffect, useState } from 'react'
import { getFileName } from '../../../../../utils/path-format'
import { IconEye } from '@tabler/icons-react'
import Button from '../Button'
import InputText from '../InputText'
import VideoJS, { getPlayer } from '../Videojs'

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
  onMediaLoaded,
}) {
  const playerId = 'player'; // resolveMediaId(mediaPath)
  const isThereMedia = !!mediaPath
  const mediaName = isThereMedia && getFileName(mediaPath)
  const mediaSrc = isThereMedia && encodeURI('imgx://' + mediaPath).replace(/#/g, '%23')

  let [mediaTag, setMediaTag] = useState();

  useEffect(() => {
    let tag = null;
    if (mediaType?.toLowerCase().startsWith('image')) {
      tag = (
        <img
          alt=""
          className="h-full object-contain mx-auto"
          src={mediaSrc ? mediaSrc : undefined}
          onLoad={(e) => {
            onMediaLoaded?.({ width: e.target.naturalWidth, height: e.target.naturalHeight })
          }}
        />
      )
    } else if (mediaType?.toLowerCase().startsWith('video') || mediaType?.toLowerCase().startsWith('audio')) {
      tag = (
        <VideoJS
          key={mediaSrc}
          options={{
            autoplay: true,
            controls: true,
            responsive: true,
            fluid: mediaType?.toLowerCase().startsWith('audio'),
            audioOnlyMode: mediaType?.toLowerCase().startsWith('audio'),
            fill: mediaType?.toLowerCase().startsWith('video'),
            sources: [
              {
                src: mediaSrc
                // type: mediaType
              }
            ],
            id: playerId
          }}
          onReady={(player) => {
            // Persist volume and muted state
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
            if (player.readyState() >= 1) {
              triggerLoaded()
            } else {
              player.one('loadedmetadata', triggerLoaded)
            }
          }}
        />
      )
    }
    setMediaTag(tag)
  }, [mediaSrc, onMediaLoaded])

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

          {/* Image Name */}
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
            variant='secondary'
          >
            <IconEye size={18} />
          </Button>

          {/* Image Controller */}
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
              disabled={disabled || !isThereMedia}
              onClick={async () => {
                getPlayer(playerId)?.dispose();
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

        {/* Media Meta */}
        <div className="flex gap-4 text-[.7rem] font-mono font-bold tracking-wider px-2 opacity-70">
          {mediaMeta.map((meta, idx) => (
            <div key={idx}>{meta}</div>
          ))}
        </div>
      </div>
      {/* Media Viewer */}
      <div className="h-full overflow-hidden select-none bg-slate-900 rounded-lg border border-slate-800 p-3">{mediaTag}</div>
    </div>
  )
}

export default React.memo(MediaViewer)
