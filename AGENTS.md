# AGENTS.md

## Project: hdp (OpenCode CLI)

A CLI tool built with Bun + TypeScript. The binary is `bin/hdp` which imports `src/index.ts`.

## Commands

```bash
bun run typecheck    # tsgo --noEmit (Effect-idiomatic type checking)
bun run test         # bun test --timeout 30000
bun run dev          # bun run --conditions=browser ./src/index.ts
bun run build        # Builds the project (check if script/build.ts exists)
```

## Key Path Aliases

- `@/*` → `./src/*`
- `@tui/*` → `./src/cli/cmd/tui/*`
- `@opencode-ai/util/*` → `./lib/util/*`
- `@opencode-ai/plugin` → `./lib/plugin/index`
- `@opencode-ai/sdk` → `./lib/sdk/index`

## Architecture

- **Entry point**: `src/index.ts` - yargs CLI with ~25 commands
- **Main commands**: `run`, `acp`, `mcp`, `serve`, `agent`, `tui`, `debug`, `db`
- **Database**: SQLite via Drizzle ORM (`src/storage/db.ts`), migrations in `migration/`
- **Event system**: `SyncEvent` for event sourcing, `Bus` for pub/sub
- **Effect framework**: Uses `effect` library with Effect-idiomatic patterns

## Database

- Uses conditional imports: `#db` resolves to `db.bun.ts` or `db.node.ts`
- SQLite WAL mode, foreign keys enabled
- Migrations in `migration/{timestamp}/migration.sql` format
- JSON migration (`src/storage/json-migration.ts`) migrates legacy JSON storage to SQLite

## SDK Codegen

`lib/sdk/script_build.ts` generates types from OpenAPI spec at `openapi.json`. Run this to regenerate SDK types.

## Tree-sitter Parsers

`parsers-config.ts` configures WASM parsers and queries for 20+ languages. Parser queries come from nvim-treesitter repo with some compatibility notes.

## Notable Conventions

- No comments in code (enforced)
- Effect-idiomatic patterns with `@effect/language-service` plugin for TS
- Sync events use `SyncEvent.define()` with `schema` and optional `busSchema` for backwards compat
- Use `Database.transaction()` for DB operations
- Trusted native deps: `node-pty`, `tree-sitter`, `web-tree-sitter`, `protobufjs`
