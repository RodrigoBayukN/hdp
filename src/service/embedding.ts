import { client } from "@/cli/cmd/tui/worker"

export async function getEmbedding(text: string): Promise<number[]> {
  return await client.call("getEmbedding", text)
}
