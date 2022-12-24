import { getFileName } from "../../../../../utils/path-format";
import Button from "../Button";
import InputText from "../InputText";

export default function ImageViewer({ 
  className, 
  imagePath,
  newImagePath,
  allowNext,
  allowPrev,
  onNext,
  onPrev,
  onRename,
}) {
  const isThereImage = !!imagePath;
  const imageName = newImagePath && getFileName(newImagePath);

  const handleRenameImage = async () => {
    const newPath = await window.api.renameFile(imagePath, newImagePath);
    onRename?.(newPath);
    if (allowNext) onNext?.();
  }

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
        <div className="flex gap-2 text-white">
          <Button
            title="Previous"
            className="bg-button rounded px-2 disabled:opacity-70"
            // disabled={index - 1 < 0}
            disabled={!allowPrev}
            onClick={onPrev}
          >
            &lt;
          </Button>
          <Button
            title="Rename"
            className="bg-button uppercase rounded px-2 py-1 disabled:opacity-70"
            disabled={!isThereImage}
            onClick={handleRenameImage}
          >
            Rename
          </Button>
          <Button
            title="Next"
            className="bg-button rounded px-2 disabled:opacity-70"
            // disabled={index + 1 >= imgs.length}
            disabled={!allowNext}
            onClick={onNext}
          >
            &gt;
          </Button>
        </div>
      </div>
      <div className="h-full overflow-hidden select-none">
        <img alt="" className="h-full object-contain mx-auto" src={imagePath && "imgx://"+encodeURI(imagePath)} />
      </div>
    </div>
  )
}
