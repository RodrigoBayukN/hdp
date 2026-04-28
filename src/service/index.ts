import { Database } from "../storage/db"
import { getEmbedding } from "./embedding"
import { sql } from "drizzle-orm"

export namespace IndexService {
  export async function add(project_path: string, file_path: string, content: string, chunk_index: number) {
    const embedding = await getEmbedding(content)
    const float32 = new Float32Array(embedding)
    
    await Database.use(async (db) => {
      // Insert metadata
      const result = db.run(sql`
        INSERT INTO vector_metadata (project_path, file_path, content, chunk_index, created_at)
        VALUES (${project_path}, ${file_path}, ${content}, ${chunk_index}, ${Date.now()})
      `)
      
      const rowid = result.lastInsertRowid as number
      
      // Insert vector
      db.run(sql`
        INSERT INTO vector_index (rowid, embedding)
        VALUES (${rowid}, ${new Uint8Array(float32.buffer)})
      `)
    })
  }

  export async function search(project_path: string, query: string, limit = 5) {
    const embedding = await getEmbedding(query)
    const float32 = new Float32Array(embedding)

    return await Database.use(async (db) => {
      const results = db.all(sql`
        SELECT 
          m.file_path,
          m.content,
          v.distance
        FROM vector_index v
        JOIN vector_metadata m ON v.rowid = m.id
        WHERE m.project_path = ${project_path}
          AND v.embedding MATCH ${new Uint8Array(float32.buffer)}
          AND k = ${limit}
        ORDER BY distance
      `)
      return results
    })
  }
}
