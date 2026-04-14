import { useDialog } from "@tui/ui/dialog"
import { useSDK } from "../context/sdk"
import { useToast } from "../ui/toast"
import { DialogPrompt } from "@tui/ui/dialog-prompt"
import { DialogProjectList } from "./dialog-project-list"
import path from "path"

export function DialogProjectCreate() {
  const dialog = useDialog()
  const sdk = useSDK()
  const toast = useToast()

  function askName(projectPath: string) {
    // Determine a default name from the path
    const resolvedPath = projectPath.endsWith("/") ? projectPath.slice(0, -1) : projectPath
    const defaultName = path.basename(resolvedPath) || "New Project"
    
    dialog.replace(() => (
      <DialogPrompt
        title="Step 2: Project Name"
        value={defaultName}
        placeholder="How should this project be named?"
        onConfirm={async (name) => {
          try {
            const resp = await sdk.fetch(`${sdk.url}/project`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                path: projectPath,
                name: name || defaultName
              }),
            })
            
            if (!resp.ok) {
              const err = await resp.text()
              throw new Error(err || "Failed to add project")
            }

            toast.show({ variant: "success", message: "Project registered successfully" })
            dialog.replace(() => <DialogProjectList />)
          } catch (e: any) {
            toast.show({ variant: "error", message: e.message })
          }
        }}
      />
    ))
  }

  return (
    <DialogPrompt
      title="Step 1: Project Path"
      placeholder="Paste the ABSOLUTE path here"
      onConfirm={(p) => {
        if (!p) return
        // Small timeout to prevent "Enter" from skipping the next step
        setTimeout(() => askName(p), 150)
      }}
    />
  )
}
