import React from 'react'
import { getFileName } from '../../../../../utils/path-format'
import Button from '../Button'
import InputText from '../InputText'

function ImageViewer({
  className,
  disabled = false,
  imagePath,
  allowNext,
  allowPrev,
  onNext,
  onPrev,
  buttonText,
  onButtonClick
}) {
  const isThereImage = !!imagePath
  const imageName = isThereImage && getFileName(imagePath)
  
  return (
    <div className={['flex flex-col gap-2 px-2', className].join(' ')}>
      <div className="flex gap-2">
        {/* Image Name */}
        <InputText
          className="flex-1"
          value={imageName || 'None'}
          disabled={!isThereImage}
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
            disabled={disabled || !isThereImage}
            onClick={async () => {
              await onButtonClick?.(imagePath)
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
          src={imagePath && encodeURI('imgx://' + imagePath)}
        />
      </div>
    </div>
  )
}

export default React.memo(ImageViewer)
