import { Database } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"
import { load } from "sqlite-vec"

export function init(path: string) {
  const sqlite = new Database(path, { create: true })
  load(sqlite)
  const db = drizzle({ client: sqlite })
  return db
}
