import { Database } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"

export function init(path: string) {
  const sqlite = new Database(path, { create: true })
  
  try {
    // Attempt to load sqlite-vec extension for semantic search
    const { load } = require("sqlite-vec");
    load(sqlite)
  } catch (e) {
    // Gracefully fallback if the native extension (.so/.dll/.dylib) is not present
    // This allows the standalone binary to work even without semantic search
    console.debug("sqlite-vec extension not available in this environment. Semantic search will be disabled.");
  }
  
  const db = drizzle({ client: sqlite })
  return db
}
