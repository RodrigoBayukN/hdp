import { DialogPrompt } from "@tui/ui/dialog-prompt"
import { useDialog } from "@tui/ui/dialog"
import { useSDK } from "../context/sdk"
import { useToast } from "../ui/toast"

interface DialogProjectRenameProps {
  projectId: string
  currentName: string
  onDone: () => void
}

export function DialogProjectRename(props: DialogProjectRenameProps) {
  const dialog = useDialog()
  const sdk = useSDK()
  const toast = useToast()

  return (
    <DialogPrompt
      title="Rename Project"
      value={props.currentName}
      onConfirm={async (newName) => {
        if (!newName) return
        try {
          const resp = await sdk.fetch(`${sdk.url}/project/${props.projectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName }),
          })
          if (!resp.ok) throw new Error(await resp.text())
          
          toast.show({ variant: "success", message: "Project renamed" })
          props.onDone()
          dialog.clear()
        } catch (e: any) {
          toast.show({ variant: "error", message: e.message ?? "Failed to rename" })
        }
      }}
      onCancel={() => dialog.clear()}
    />
  )
}
