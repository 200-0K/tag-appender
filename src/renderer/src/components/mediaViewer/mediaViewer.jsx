import React from 'react'
import { getFileName } from '../../../../../utils/path-format'
import Button from '../Button'
import InputText from '../InputText'

function MediaViewer({
  className,
  disabled = false,
  mediaPath,
  allowNext,
  allowPrev,
  onNext,
  onPrev,
  buttonText,
  onButtonClick
}) {
  const isThereMedia = !!mediaPath
  const mediaName = isThereMedia && getFileName(mediaPath)
  
  return (
    <div className={['flex flex-col gap-2 px-2', className].join(' ')}>
      <div className="flex gap-2">
        {/* Image Name */}
        <InputText
          className="flex-1"
          value={mediaName || 'None'}
          disabled={!isThereMedia}
          readOnly
        />

        {/* Image Controller */}
        <div className="flex gap-2 text-white select-none">
          <Button
            title="Previous"
            disabled={disabled || !allowPrev}
            onClick={onPrev}
          >
            &lt;
          </Button>
          <Button
            title={buttonText}
            className="uppercase"
            disabled={disabled || !isThereMedia}
            onClick={async () => {
              await onButtonClick?.(mediaPath)
              if (allowNext) onNext?.()
            }}
          >
            {buttonText}
          </Button>
          <Button
            title="Next"
            disabled={disabled || !allowNext}
            onClick={onNext}
          >
            &gt;
          </Button>
        </div>
      </div>
      <div className="h-full overflow-hidden select-none">
        <img
          alt=""
          className="h-full object-contain mx-auto"
          src={mediaPath && encodeURI('imgx://' + mediaPath).replace(/#/g, '%23')}
        />
      </div>
    </div>
  )
}

export default React.memo(MediaViewer)
