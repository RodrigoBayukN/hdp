import { Database } from "../storage/db"
import { sql } from "drizzle-orm"

export namespace IndexServiceInit {
  export async function init() {
    await Database.use(async (db) => {
      // Create metadata table
      db.run(sql`
        CREATE TABLE IF NOT EXISTS vector_metadata (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_path TEXT NOT NULL,
          file_path TEXT NOT NULL,
          content TEXT NOT NULL,
          chunk_index INTEGER NOT NULL,
          created_at INTEGER NOT NULL
        )
      `)

      // Create virtual table for vectors (dim=384 for all-MiniLM-L6-v2)
      try {
        db.run(sql`
          CREATE VIRTUAL TABLE IF NOT EXISTS vector_index USING vec0(
            embedding float[384]
          )
        `)
      } catch (e) {
        // Silently ignore if sqlite-vec is not available in this environment
      }
    })
  }
}
