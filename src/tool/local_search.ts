import z from "zod"
import { Effect } from "effect"
import { Tool } from "./tool"
import { IndexService } from "../service/index"
import { Instance } from "../project/instance"

export const LocalSearchTool = Tool.define(
  "local_search",
  Effect.gen(function* () {
    return {
      description: "Perform a semantic (vector) search in the local project index. Use this to find relevant code or information based on meaning rather than exact keywords.",
      parameters: z.object({
        query: z.string().describe("The search query (natural language)."),
        limit: z.number().optional().default(5).describe("Maximum number of results to return."),
      }),
      execute: (params: { query: string; limit?: number }, ctx: Tool.Context) =>
        Effect.gen(function* () {
          const projectPath = Instance.directory
          const results = yield* Effect.promise(() => IndexService.search(projectPath, params.query, params.limit))

          if (results.length === 0) {
            return {
              output: "No relevant results found in the local index. You might need to index the project first using 'local_index'.",
              title: "Local Semantic Search",
              metadata: {},
            }
          }

          const output = results.map((r: any) => `File: ${r.file_path} (Distance: ${r.distance.toFixed(4)})\n---\n${r.content}\n---`).join("\n\n")

          return {
            output,
            title: `Local Search: ${params.query}`,
            metadata: { count: results.length },
          }
        }).pipe(Effect.orDie),
    }
  }),
)
