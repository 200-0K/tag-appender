import React from 'react'
import { directoryPicker } from '../../utils/pickers'
import Button from '../Button'
import InputText from '../InputText'

function FileBrowser({ dir, onDirChange, className }) {
  const handleBrowse = async () => {
    const newDir = await directoryPicker()
    if (!newDir) return
    onDirChange?.(newDir)
  }

  return (
    <div className={['flex gap-2 text-xs', className].join(' ')}>
      <InputText className="flex-1" value={dir || 'None'} disabled={!dir} readOnly />
      <Button onClick={handleBrowse}>Browse</Button>
    </div>
  )
}

export default React.memo(FileBrowser)
