declare global {
  const HDP_VERSION: string
  const HDP_CHANNEL: string
}

export const VERSION = typeof HDP_VERSION === "string" ? HDP_VERSION : "local"
export const CHANNEL = typeof HDP_CHANNEL === "string" ? HDP_CHANNEL : "local"
