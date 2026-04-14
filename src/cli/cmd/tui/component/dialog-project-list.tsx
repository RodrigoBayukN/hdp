import { useDialog } from "@tui/ui/dialog"
import { DialogSelect } from "@tui/ui/dialog-select"
import { createEffect, createMemo, createResource, createSignal, onMount } from "solid-js"
import { useTheme } from "../context/theme"
import { useSDK } from "../context/sdk"
import { useToast } from "../ui/toast"
import { useExit } from "../context/exit"
import { useKeyboard, useRenderer } from "@opentui/solid"
import { Keybind } from "@/util/keybind"
import { DialogPrompt } from "@tui/ui/dialog-prompt"
import { useKeybind } from "../context/keybind"
import { DialogProjectRename } from "./dialog-project-rename"

// Manually defining more complete type since SDK gen might be outdated
interface ProjectInfo {
  id: string
  worktree: string
  name?: string
  time: {
    created: number
    updated: number
  }
}

export function DialogProjectList() {
  const dialog = useDialog()
  const { theme } = useTheme()
  const sdk = useSDK()
  const toast = useToast()
  const exit = useExit()
  const renderer = useRenderer()
  const keybind = useKeybind()
  const [toDelete, setToDelete] = createSignal<string>()

  const [projects, { refetch }] = createResource(async () => {
    try {
      const result = await sdk.client.project.list()
      return (result.data as unknown as ProjectInfo[]) ?? []
    } catch (e) {
      console.error("List failed", e)
      return []
    }
  })

  const options = createMemo(() => {
    return (projects() ?? []).map((p) => {
      const isDeleting = toDelete() === p.id
      return {
        title: isDeleting ? `[CONFIRM DELETE]` : (p.name ?? "unnamed"),
        bg: isDeleting ? theme.error : undefined,
        value: p.id,
        description: p.worktree,
      }
    })
  })

  onMount(() => {
    dialog.setSize("large")
  })

  // Track the currently highlighted option to support manual keyboard triggers
  const [activeId, setActiveId] = createSignal<string>()

  createEffect(() => {
    if (!activeId() && options().length > 0) {
      setActiveId(options()[0].value)
    }
  })

  useKeyboard((evt) => {
    const id = activeId()
    
    // DEBUG: Ver todo lo que llega
    if (evt.ctrl) {
      toast.show({ message: `TECLA: ctrl+${evt.name} | ID ACTIVO: ${id || "ninguno"}`, variant: "info" })
    }

    if (evt.ctrl && (evt.name === "r" || evt.name === "R")) {
      if (id) handleRename(id)
    } else if (evt.ctrl && (evt.name === "d" || evt.name === "D")) {
      if (id) handleDelete(id)
    }
  })

  async function handleRename(id: string) {
    const project = projects()?.find((p) => p.id === id)
    if (!project) {
      toast.show({ message: `Project not found for rename: ${id}`, variant: "error" })
      return
    }
    
    toast.show({ message: "Abriendo editor de nombre...", variant: "info" })
    dialog.replace(() => (
      <DialogProjectRename 
        projectId={project.id} 
        currentName={project.name ?? ""} 
        onDone={() => refetch()}
      />
    ))
  }

  async function handleDelete(id: string) {
    if (toDelete() === id) {
      try {
        const resp = await sdk.fetch(`${sdk.url}/project/${id}`, {
          method: "DELETE",
        })
        if (!resp.ok) throw new Error(await resp.text())
        
        toast.show({ variant: "success", message: "Project removed" })
        setToDelete(undefined)
        refetch()
      } catch (e: any) {
        toast.show({ variant: "error", message: e.message ?? "Failed to remove project" })
      }
      return
    }
    setToDelete(id)
  }

  return (
    <DialogSelect
      title="Projects"
      options={options()}
      onMove={(option) => {
        setToDelete(undefined)
        setActiveId(option?.value)
      }}
      onSelect={(option) => {
        const pList = projects()
        const project = pList?.find((p) => p.id === option.value)
        if (!project) return

        toast.show({ message: "Opening project...", variant: "info" })

        setTimeout(() => {
          renderer.dispose()
          const { spawn } = require("child_process")
          const bin = process.argv[0]
          const args = [process.argv[1], project.worktree]
          
          const child = spawn(bin, args, {
            stdio: "inherit",
            detached: true
          })
          child.unref()
          process.exit(0)
        }, 100)
      }}
      keybind={[
        {
          keybind: keybind.all.session_delete?.[0],
          title: "delete",
          onTrigger: (option) => handleDelete(option.value),
        },
        {
          keybind: keybind.all.session_rename?.[0],
          title: "rename",
          onTrigger: (option) => handleRename(option.value),
        },
      ]}
    />
  )
}
