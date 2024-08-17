import React, { useEffect, useState } from 'react'
import { getFileName } from '../../../../../utils/path-format'
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
  statusHtml = null,
}) {
  const playerId = 'player'; // resolveMediaId(mediaPath)
  const isThereMedia = !!mediaPath
  const mediaName = isThereMedia && getFileName(mediaPath)
  const mediaSrc = isThereMedia && encodeURI('imgx://' + mediaPath).replace(/#/g, '%23')

  let [mediaTag, setMediaTag] = useState();

  useEffect(() => {
    let tag = null;
    if (mediaType?.toLowerCase().startsWith('image')) {
      tag = <img alt="" className="h-full object-contain mx-auto" src={mediaSrc ? mediaSrc : undefined} />
    } else if (mediaType?.toLowerCase().startsWith('video') || mediaType?.toLowerCase().startsWith('audio')) {
      tag = (
        <VideoJS key={mediaType} options={{
          autoplay: true,
          controls: true,
          responsive: true,
          fluid: mediaType?.toLowerCase().startsWith('audio'),
          audioOnlyMode: mediaType?.toLowerCase().startsWith('audio'),
          fill: mediaType?.toLowerCase().startsWith('video'),
          sources: [{
            src: mediaSrc,
            // type: mediaType
          }],
          id: playerId,
        }} />
      )
    }
    setMediaTag(tag);
  }, [mediaSrc]);

  return (
    <div className={['flex flex-col gap-2 px-2', className].join(' ')}>
      <div className="flex flex-col gap-1">
        <div className="flex gap-2 items-center">
          {statusHtml}

          {/* Image Name */}
          <InputText
            className="flex-1 py-4"
            value={mediaName || 'None'}
            disabled={!isThereMedia}
            readOnly
          />

          {/* Image Controller */}
          <div className="flex gap-2 text-white select-none">
            <Button
              title="Previous"
              className="py-2"
              disabled={disabled || !allowPrev}
              onClick={onPrev}
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
              title="Next"
              className="py-2"
              disabled={disabled || !allowNext}
              onClick={onNext}
            >
              &gt;
            </Button>
          </div>
        </div>

        {/* Media Meta */}
        <div className="flex gap-4 text-[.6rem] px-2 opacity-70">
          {mediaMeta.map((meta, idx) => (
            <div key={idx}>{meta}</div>
          ))}
        </div>
      </div>
      {/* Media Viewer */}
      <div className="h-full overflow-hidden select-none">{mediaTag}</div>
    </div>
  )
}

export default React.memo(MediaViewer)
