export * from "./client.js"
export * from "./server.js"

import { createHDPClient } from "./client.js"
import { createHDPServer } from "./server.js"
import type { ServerOptions } from "./server.js"

export * as data from "./data.js"

export async function createHDP(options?: ServerOptions) {
  const server = await createHDPServer({
    ...options,
  })

  const client = createHDPClient({
    baseUrl: server.url,
  })

  return {
    client,
    server,
  }
}
