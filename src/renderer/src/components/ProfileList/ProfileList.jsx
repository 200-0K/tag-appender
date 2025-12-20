import Swal from 'sweetalert2'
import { getFileName, getFileWithoutExtension } from '../../../../../utils/path-format'
import { getProfiles } from '../../pages/App/utils/profiles'
import { DEFAULT_PROFILE } from '../../pages/App/utils/profile-defaults'

import Button from '../Button'
import DropdownMenu from '../DropdownMenu'

export default function ProfileList({ profiles, currentProfile, setProfiles, setCurrentProfile }) {
  return (
    <div className="flex gap-2">
      <DropdownMenu
        items={profiles.map((profilePath) => ({
          value: profilePath,
          displayValue: getFileName(profilePath)
        }))}
        handleItemChange={(profile) => setCurrentProfile(profile)}
        selectedItem={currentProfile}
        title="Profile"
        className="flex-1"
      />
      <Button
        onClick={async () => {
          const { value: filename } = await Swal.fire({
            title: 'File Name?',
            input: 'text',
            showCancelButton: true,
            inputValidator: async (filename) => {
              if (!filename) return 'File name cannot be empty.'
              else if (!(await window.api.createTagFile(filename + '.ta')))
                return 'Error Creating File: There was an error creating the file. Please choose a different name and try again.'
              else {
                // Initialize with default profile structure
                await window.api.writeJsonFile(filename + '.ta', DEFAULT_PROFILE)
              }
            }
          })

          if (!filename) return

          const profiles = (await getProfiles()) ?? []
          setProfiles(profiles)
          setCurrentProfile(
            profiles.find((profile) => getFileWithoutExtension(getFileName(profile)) == filename) ??
              profiles[0]
          )
        }}
      >
        +
      </Button>
    </div>
  )
}
