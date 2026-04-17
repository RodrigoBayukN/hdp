import { Config } from "effect"

function truthy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "true" || value === "1"
}

function falsy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "false" || value === "0"
}

export namespace Flag {
  export const OTEL_EXPORTER_OTLP_ENDPOINT = process.env["OTEL_EXPORTER_OTLP_ENDPOINT"]
  export const OTEL_EXPORTER_OTLP_HEADERS = process.env["OTEL_EXPORTER_OTLP_HEADERS"]

  export const HDP_AUTO_SHARE = truthy("HDP_AUTO_SHARE")
  export const HDP_AUTO_HEAP_SNAPSHOT = truthy("HDP_AUTO_HEAP_SNAPSHOT")
  export const HDP_GIT_BASH_PATH = process.env["HDP_GIT_BASH_PATH"]
  export const HDP_CONFIG = process.env["HDP_CONFIG"]
  export declare const HDP_PURE: boolean
  export declare const HDP_TUI_CONFIG: string | undefined
  export declare const HDP_CONFIG_DIR: string | undefined
  export declare const HDP_PLUGIN_META_FILE: string | undefined
  export const HDP_CONFIG_CONTENT = process.env["HDP_CONFIG_CONTENT"]
  export const HDP_DISABLE_AUTOUPDATE = truthy("HDP_DISABLE_AUTOUPDATE")
  export const HDP_ALWAYS_NOTIFY_UPDATE = truthy("HDP_ALWAYS_NOTIFY_UPDATE")
  export const HDP_DISABLE_PRUNE = truthy("HDP_DISABLE_PRUNE")
  export const HDP_DISABLE_TERMINAL_TITLE = truthy("HDP_DISABLE_TERMINAL_TITLE")
  export const HDP_SHOW_TTFD = truthy("HDP_SHOW_TTFD")
  export const HDP_PERMISSION = process.env["HDP_PERMISSION"]
  export const HDP_DISABLE_DEFAULT_PLUGINS = truthy("HDP_DISABLE_DEFAULT_PLUGINS")
  export const HDP_DISABLE_LSP_DOWNLOAD = truthy("HDP_DISABLE_LSP_DOWNLOAD")
  export const HDP_ENABLE_EXPERIMENTAL_MODELS = truthy("HDP_ENABLE_EXPERIMENTAL_MODELS")
  export const HDP_DISABLE_AUTOCOMPACT = truthy("HDP_DISABLE_AUTOCOMPACT")
  export const HDP_DISABLE_MODELS_FETCH = truthy("HDP_DISABLE_MODELS_FETCH")
  export const HDP_DISABLE_MOUSE = truthy("HDP_DISABLE_MOUSE")
  export const HDP_DISABLE_CLAUDE_CODE = truthy("HDP_DISABLE_CLAUDE_CODE")
  export const HDP_DISABLE_CLAUDE_CODE_PROMPT =
    HDP_DISABLE_CLAUDE_CODE || truthy("HDP_DISABLE_CLAUDE_CODE_PROMPT")
  export const HDP_DISABLE_CLAUDE_CODE_SKILLS =
    HDP_DISABLE_CLAUDE_CODE || truthy("HDP_DISABLE_CLAUDE_CODE_SKILLS")
  export const HDP_DISABLE_EXTERNAL_SKILLS =
    HDP_DISABLE_CLAUDE_CODE_SKILLS || truthy("HDP_DISABLE_EXTERNAL_SKILLS")
  export declare const HDP_DISABLE_PROJECT_CONFIG: boolean
  export const HDP_FAKE_VCS = process.env["HDP_FAKE_VCS"]
  export declare const HDP_CLIENT: string
  export const HDP_SERVER_PASSWORD = process.env["HDP_SERVER_PASSWORD"]
  export const HDP_SERVER_USERNAME = process.env["HDP_SERVER_USERNAME"]
  export const HDP_ENABLE_QUESTION_TOOL = truthy("HDP_ENABLE_QUESTION_TOOL")

  // Experimental
  export const HDP_EXPERIMENTAL = truthy("HDP_EXPERIMENTAL")
  export const HDP_EXPERIMENTAL_FILEWATCHER = Config.boolean("HDP_EXPERIMENTAL_FILEWATCHER").pipe(
    Config.withDefault(false),
  )
  export const HDP_EXPERIMENTAL_DISABLE_FILEWATCHER = Config.boolean(
    "HDP_EXPERIMENTAL_DISABLE_FILEWATCHER",
  ).pipe(Config.withDefault(false))
  export const HDP_EXPERIMENTAL_ICON_DISCOVERY =
    HDP_EXPERIMENTAL || truthy("HDP_EXPERIMENTAL_ICON_DISCOVERY")

  const copy = process.env["HDP_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"]
  export const HDP_EXPERIMENTAL_DISABLE_COPY_ON_SELECT =
    copy === undefined ? process.platform === "win32" : truthy("HDP_EXPERIMENTAL_DISABLE_COPY_ON_SELECT")
  export const HDP_ENABLE_EXA =
    truthy("HDP_ENABLE_EXA") || HDP_EXPERIMENTAL || truthy("HDP_EXPERIMENTAL_EXA")
  export const HDP_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS = number("HDP_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS")
  export const HDP_EXPERIMENTAL_OUTPUT_TOKEN_MAX = number("HDP_EXPERIMENTAL_OUTPUT_TOKEN_MAX")
  export const HDP_EXPERIMENTAL_OXFMT = HDP_EXPERIMENTAL || truthy("HDP_EXPERIMENTAL_OXFMT")
  export const HDP_EXPERIMENTAL_LSP_TY = truthy("HDP_EXPERIMENTAL_LSP_TY")
  export const HDP_EXPERIMENTAL_LSP_TOOL = HDP_EXPERIMENTAL || truthy("HDP_EXPERIMENTAL_LSP_TOOL")
  export const HDP_DISABLE_FILETIME_CHECK = Config.boolean("HDP_DISABLE_FILETIME_CHECK").pipe(
    Config.withDefault(false),
  )
  export const HDP_EXPERIMENTAL_PLAN_MODE = HDP_EXPERIMENTAL || truthy("HDP_EXPERIMENTAL_PLAN_MODE")
  export const HDP_EXPERIMENTAL_WORKSPACES = HDP_EXPERIMENTAL || truthy("HDP_EXPERIMENTAL_WORKSPACES")
  export const HDP_EXPERIMENTAL_MARKDOWN = !falsy("HDP_EXPERIMENTAL_MARKDOWN")
  export const HDP_MODELS_URL = process.env["HDP_MODELS_URL"]
  export const HDP_MODELS_PATH = process.env["HDP_MODELS_PATH"]
  export const HDP_DISABLE_EMBEDDED_WEB_UI = truthy("HDP_DISABLE_EMBEDDED_WEB_UI")
  export const HDP_DB = process.env["HDP_DB"]
  export const HDP_DISABLE_CHANNEL_DB = truthy("HDP_DISABLE_CHANNEL_DB")
  export const HDP_SKIP_MIGRATIONS = truthy("HDP_SKIP_MIGRATIONS")
  export const HDP_STRICT_CONFIG_DEPS = truthy("HDP_STRICT_CONFIG_DEPS")

  function number(key: string) {
    const value = process.env[key]
    if (!value) return undefined
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
  }
}

// Dynamic getter for HDP_DISABLE_PROJECT_CONFIG
// This must be evaluated at access time, not module load time,
// because external tooling may set this env var at runtime
Object.defineProperty(Flag, "HDP_DISABLE_PROJECT_CONFIG", {
  get() {
    return truthy("HDP_DISABLE_PROJECT_CONFIG")
  },
  enumerable: true,
  configurable: false,
})

// Dynamic getter for HDP_TUI_CONFIG
// This must be evaluated at access time, not module load time,
// because tests and external tooling may set this env var at runtime
Object.defineProperty(Flag, "HDP_TUI_CONFIG", {
  get() {
    return process.env["HDP_TUI_CONFIG"]
  },
  enumerable: true,
  configurable: false,
})

// Dynamic getter for HDP_CONFIG_DIR
// This must be evaluated at access time, not module load time,
// because external tooling may set this env var at runtime
Object.defineProperty(Flag, "HDP_CONFIG_DIR", {
  get() {
    return process.env["HDP_CONFIG_DIR"]
  },
  enumerable: true,
  configurable: false,
})

// Dynamic getter for HDP_PURE
// This must be evaluated at access time, not module load time,
// because the CLI can set this flag at runtime
Object.defineProperty(Flag, "HDP_PURE", {
  get() {
    return truthy("HDP_PURE")
  },
  enumerable: true,
  configurable: false,
})

// Dynamic getter for HDP_PLUGIN_META_FILE
// This must be evaluated at access time, not module load time,
// because tests and external tooling may set this env var at runtime
Object.defineProperty(Flag, "HDP_PLUGIN_META_FILE", {
  get() {
    return process.env["HDP_PLUGIN_META_FILE"]
  },
  enumerable: true,
  configurable: false,
})

// Dynamic getter for HDP_CLIENT
// This must be evaluated at access time, not module load time,
// because some commands override the client at runtime
Object.defineProperty(Flag, "HDP_CLIENT", {
  get() {
    return process.env["HDP_CLIENT"] ?? "cli"
  },
  enumerable: true,
  configurable: false,
})
