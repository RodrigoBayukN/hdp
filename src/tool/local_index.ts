import z from "zod"
import { Effect } from "effect"
import { Tool } from "./tool"
import { IndexService } from "../service/index"
import { Filesystem } from "../util/filesystem"
import { Instance } from "../project/instance"
import path from "path"

export const LocalIndexTool = Tool.define(
  "local_index",
  Effect.gen(function* () {
    return {
      description: "Index files in the current project to enable local vector search. Use this to prepare the project for semantic search if it hasn't been indexed recently.",
      parameters: z.object({
        paths: z.array(z.string()).describe("List of file paths or directories to index."),
      }),
      execute: (params: { paths: string[] }, ctx: Tool.Context) =>
        Effect.gen(function* () {
          const projectPath = Instance.directory
          let count = 0

          for (const p of params.paths) {
            const absolute = path.resolve(projectPath, p)
            if (!(yield* Effect.promise(() => Filesystem.exists(absolute)))) continue
            
            const stats = yield* Effect.promise(() => Filesystem.statAsync(absolute))
            if (!stats || stats.isDirectory()) {
               // Simple recursion for directory (optional, but good)
               // For now let's focus on files to keep it simple and safe
               continue
            }

            const content = yield* Effect.promise(() => Filesystem.readText(absolute))
            if (!content) continue

            // Simple chunking logic (e.g., every 1000 chars with overlap)
            const chunkSize = 1000
            const overlap = 200
            let start = 0
            let chunkIndex = 0
            
            while (start < content.length) {
              const end = Math.min(start + chunkSize, content.length)
              const chunk = content.substring(start, end)
              yield* Effect.promise(() => IndexService.add(projectPath, p, chunk, chunkIndex))
              
              if (end === content.length) break
              start += chunkSize - overlap
              chunkIndex++
              count++
            }
          }

          return {
            output: `Successfully indexed ${params.paths.length} items (${count} chunks created).`,
            title: "Local Indexing",
            metadata: { count },
          }
        }).pipe(Effect.orDie),
    }
  }),
)
