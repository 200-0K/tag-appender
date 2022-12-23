import { useEffect, useState } from "react";
import Button from "../Button";
import InputText from "../InputText";

export default function FileBrowser({ dir, onDirChange }) {
  const handleBrowse = async () => {
    const newDir = await window.api.directoryPicker();
    if (!newDir) return;
    onDirChange?.(newDir)
  }

  return (
    <div className='flex-1 flex gap-2 text-xs'>
      <InputText 
        className="flex-1"
        value={ dir || "None"} 
        disabled={ !dir }
        readOnly
      />
      <Button
        onClick={handleBrowse}
      >
        Browse
      </Button>
    </div>
  );
}