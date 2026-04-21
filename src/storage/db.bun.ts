import { Database } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"
import { join, dirname } from "node:path"
import { existsSync } from "node:fs"

export function init(path: string) {
  const sqlite = new Database(path, { create: true })
  
  try {
    // Determine the extension format for the current OS
    const ext = process.platform === "win32" ? "dll" : process.platform === "darwin" ? "dylib" : "so";
    
    // Look for vec0 right next to the executable path
    const localExt = join(dirname(process.execPath), `vec0.${ext}`);
    
    if (existsSync(localExt)) {
      sqlite.loadExtension(localExt);
    } else {
      // Fallback to node_modules (useful for local development with `bun run dev`)
      const { load } = require("sqlite-vec");
      load(sqlite)
    }
  } catch (e) {
    // Gracefully fallback if the native extension (.so/.dll/.dylib) is not present
    console.debug("sqlite-vec extension not available in this environment. Semantic search will be disabled.");
  }
  
  const db = drizzle({ client: sqlite })
  return db
}
