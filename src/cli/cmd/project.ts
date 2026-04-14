import type { Argv } from "yargs"
import { cmd } from "./cmd"
import { Project } from "../../project/project"
import { ProjectID } from "../../project/schema"
import { bootstrap } from "../bootstrap"
import { UI } from "../ui"
import { EOL } from "os"
import path from "path"
import { Filesystem } from "../../util/filesystem"

export const ProjectCommand = cmd({
  command: "project",
  describe: "manage projects",
  builder: (yargs: Argv) =>
    yargs
      .command(ProjectAddCommand)
      .command(ProjectListCommand)
      .command(ProjectRemoveCommand)
      .command(ProjectOpenCommand)
      .demandCommand(),
  async handler() {},
})

export const ProjectAddCommand = cmd({
  command: "add <path>",
  describe: "add a project from a directory",
  builder: (yargs: Argv) => {
    return yargs
      .positional("path", {
        describe: "directory path of the project",
        type: "string",
        demandOption: true,
      })
      .option("name", {
        describe: "custom name for the project",
        type: "string",
      })
  },
  handler: async (args) => {
    const absPath = path.resolve(args.path)
    if (!Filesystem.isDir(absPath)) {
      UI.error(`Directory not found: ${absPath}`)
      process.exit(1)
    }

    await bootstrap(absPath, async () => {
      const { project } = await Project.fromDirectory(absPath)
      if (args.name) {
        await Project.update({ projectID: project.id, name: args.name })
      }
      UI.println(UI.Style.TEXT_SUCCESS_BOLD + `Project added: ${args.name ?? project.name ?? project.id}` + UI.Style.TEXT_NORMAL)
    })
  },
})

export const ProjectListCommand = cmd({
  command: "list",
  describe: "list projects",
  builder: (yargs: Argv) => yargs,
  handler: async () => {
    await bootstrap(process.cwd(), async () => {
      const projects = await Project.list()
      if (projects.length === 0) {
        UI.println("No projects found.")
        return
      }

      const lines: string[] = []
      const maxIdWidth = 10 // Show only first 8 chars of ID
      const maxNameWidth = Math.max(15, ...projects.map((p) => (p.name ?? "unnamed").length))

      const header = `ID        Name${" ".repeat(maxNameWidth - 4)}  Path`
      lines.push(UI.Style.TEXT_NORMAL_BOLD + header + UI.Style.TEXT_NORMAL)
      lines.push("─".repeat(header.length + 20))

      for (const p of projects) {
        const idBatch = p.id.slice(0, 8)
        const name = (p.name ?? "unnamed").padEnd(maxNameWidth)
        const line = `${idBatch.padEnd(maxIdWidth)}  ${name}  ${p.worktree}`
        lines.push(line)
      }
      UI.println(lines.join(EOL))
    })
  },
})

export const ProjectRemoveCommand = cmd({
  command: "remove <query>",
  describe: "remove a project by ID or name",
  builder: (yargs: Argv) => {
    return yargs.positional("query", {
      describe: "project ID or name to remove",
      type: "string",
      demandOption: true,
    })
  },
  handler: async (args) => {
    await bootstrap(process.cwd(), async () => {
      const projects = await Project.list()
      const project = projects.find(p => p.id.startsWith(args.query) || p.name === args.query)
      
      if (!project) {
        UI.error(`Project not found: ${args.query}`)
        process.exit(1)
      }
      
      await Project.remove(project.id)
      UI.println(UI.Style.TEXT_SUCCESS_BOLD + `Project ${project.name ?? project.id} removed` + UI.Style.TEXT_NORMAL)
    })
  },
})

export const ProjectOpenCommand = cmd({
  command: "open <query>",
  describe: "open a project TUI by ID or name",
  builder: (yargs: Argv) => {
    return yargs.positional("query", {
      describe: "project ID or name to open",
      type: "string",
      demandOption: true,
    })
  },
  handler: async (args) => {
    await bootstrap(process.cwd(), async () => {
      const projects = await Project.list()
      const project = projects.find(p => p.id.startsWith(args.query) || p.name === args.query)

      if (!project) {
        UI.error(`Project not found: ${args.query}`)
        process.exit(1)
      }
      
      UI.println(`Opening project ${project.name ?? project.id} at ${project.worktree}...`)
      const { spawn } = require("child_process")
      const child = spawn(process.argv[0], [process.argv[1], project.worktree], {
        stdio: "inherit",
        env: process.env,
      })
      child.on("exit", (code: number) => process.exit(code))
    })
  },
})
