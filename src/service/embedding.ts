import { Filesystem } from "@/util/filesystem"
import { Global } from "@/global"
import path from "path"
import { Rpc } from "@/util/rpc"

declare global {
  const HDP_WORKER_EMBEDDING_CODE: string
}

let client: ReturnType<typeof Rpc.client<typeof import("@/service/worker_embedding").rpc>> | undefined

async function getClient() {
  if (client) return client;
  
  // Create worker
  const file = path.join(Global.Path.temp, "hdp_worker_embedding.js")
  await Filesystem.write(file, HDP_WORKER_EMBEDDING_CODE)
  const worker = new Worker(file)
  client = Rpc.client<typeof import("@/service/worker_embedding").rpc>(worker)
  return client;
}

export async function getEmbedding(text: string): Promise<number[]> {
  const c = await getClient()
  return await c.call("getEmbedding", text)
}




