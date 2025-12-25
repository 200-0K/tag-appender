import Swal from 'sweetalert2'
import Button from '../Button'
import DropdownMenu from '../DropdownMenu'
import { cn } from '../../pages/App/utils/cn'
import { IconTrash, IconPlus } from '@tabler/icons-react'

export default function WorkspaceSelector({
  workspaces,
  activeWorkspaceId,
  onWorkspaceChange,
  onWorkspaceCreate,
  onWorkspaceDelete,
  className
}) {
  return (
    <div className={cn("flex gap-2", className)}>
      <DropdownMenu
        items={workspaces.map((w) => ({
          value: w.id,
          displayValue: w.name
        }))}
        handleItemChange={(id) => onWorkspaceChange(id)}
        selectedItem={activeWorkspaceId}
        title="Workspace"
        className="flex-1"
      />
      <Button
        onClick={async () => {
          const { value: name } = await Swal.fire({
            title: 'New Workspace Name',
            input: 'text',
            showCancelButton: true,
            inputValidator: (value) => {
              if (!value) return 'Name cannot be empty'
            }
          })

          if (name) {
            onWorkspaceCreate(name)
          }
        }}
        title="Create Workspace"
      >
        <IconPlus size={16} />
      </Button>
      <Button
        onClick={async () => {
          if (workspaces.length <= 1) {
            Swal.fire('Error', 'Cannot delete the last workspace', 'error')
            return
          }

          const active = workspaces.find(w => w.id === activeWorkspaceId)
          const { isConfirmed } = await Swal.fire({
            title: 'Delete Workspace?',
            text: `Are you sure you want to delete "${active?.name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Delete'
          })

          if (isConfirmed) {
            onWorkspaceDelete(activeWorkspaceId)
          }
        }}
        title="Delete Current Workspace"
        variant='destructive'
      >
        <IconTrash size={16} />
      </Button>
    </div>
  )
}
