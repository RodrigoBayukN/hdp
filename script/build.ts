import { build, $ } from "bun";
import { version } from "../package.json";
import { rmSync, mkdirSync, readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
// @ts-ignore
import solidPlugin from "@opentui/solid/bun-plugin";

const root = join(import.meta.dir, "..");
const dist = join(root, "dist");

function getMigrations() {
  const migrationDir = join(root, "migration");
  if (!existsSync(migrationDir)) return [];

  const time = (tag: string) => {
    const match = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/.exec(tag);
    if (!match) return 0;
    return Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6])
    );
  };

  const dirs = readdirSync(migrationDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const entries = dirs
    .map((name) => {
      const file = join(migrationDir, name, "migration.sql");
      if (!existsSync(file)) return;
      return {
        sql: readFileSync(file, "utf-8"),
        timestamp: time(name),
        name,
      };
    })
    .filter(Boolean) as { sql: string; timestamp: number; name: string }[];

  return entries.sort((a, b) => a.timestamp - b.timestamp);
}

const migrations = getMigrations();
console.log(`Found ${migrations.length} migrations to bundle.`);

console.log(`Building HDP v${version}...`);

// Clean and recreate dist
try {
  rmSync(dist, { recursive: true, force: true });
} catch (e) {}
mkdirSync(dist, { recursive: true });

// Modules that should be left as external require() calls in the final binary.
// These are native addons that must live alongside the binary on disk.
const runtimeExternals = [
  "node-pty",
  "tree-sitter",
  "fsevents",
];

// Modules that we replace with an empty stub so they vanish from the bundle.
// They must NOT be in `external` or the alias won't take effect.
const stubbedModules: Record<string, string> = {
  "onnxruntime-node": join(root, "script/empty.js"),
  "sharp": join(root, "script/empty.js"),
};

// Platform-specific optional imports from @opentui/core that get resolved
// at runtime via a dynamic require. We mark every possible variant as
// external so the bundler doesn't try to pull them in.
const opentuiPlatformPkgs = [
  "@opentui/core-linux-x64",
  "@opentui/core-linux-arm64",
  "@opentui/core-darwin-x64",
  "@opentui/core-darwin-arm64",
  "@opentui/core-win32-x64",
];

const sqliteVecPlatformPkgs = [
  "sqlite-vec-linux-x64",
  "sqlite-vec-linux-arm64",
  "sqlite-vec-darwin-x64",
  "sqlite-vec-darwin-arm64",
  "sqlite-vec-windows-x64",
];

// Everything that the *bundler* should leave alone.
const bundlerExternals = [...runtimeExternals, ...opentuiPlatformPkgs, ...sqliteVecPlatformPkgs];

// Everything the *compiler* (bun build --compile) should leave alone.
const compilerExternals = [...runtimeExternals];

// Build the worker first (referenced by src/cli/cmd/tui/thread.ts)
const workerResult = await build({
  entrypoints: [join(root, "src/cli/cmd/tui/worker.ts")],
  outdir: join(dist, "cli/cmd/tui"),
  target: "bun",
  naming: "[name].js",
  conditions: ["browser"],
  minify: true,
  plugins: [
    solidPlugin,
    {
      name: "transformers-stub",
      setup(b) {
        b.onResolve({ filter: /^@huggingface\/transformers$/ }, () => {
          return { path: join(root, "node_modules/@huggingface/transformers/dist/transformers.web.js") };
        });
        b.onResolve({ filter: /^onnxruntime-node$/ }, () => {
          return { path: join(root, "script/empty.js") };
        });
      },
    },
    {
      name: "env-cleaner",
      setup(build: any) {
        const fs = require("fs");
        build.onLoad({ filter: /\.(js|mjs)$/ }, async (args: any) => {
          if (!args.path.includes("node_modules")) return undefined;
          try {
            let contents = fs.readFileSync(args.path, "utf8");
            if (contents.includes("process?.")) {
              contents = contents.replace(/process\?\.versions\?\.node/g, "undefined");
              contents = contents.replace(/process\?\.release\?\.name/g, '"browser"');
              return { contents, loader: "js" };
            }
          } catch (e) {}
          return undefined;
        });
      },
    },
  ],
  external: bundlerExternals,
  define: {
    HDP_MIGRATIONS: JSON.stringify(migrations),
    "process.versions.node": "undefined",
    "globalThis.process.versions.node": "undefined",
    "process.release.name": '"browser"',
    "globalThis.process.release.name": '"browser"',
  },
  banner: "var process = { versions: { node: undefined }, release: { name: 'browser' }, env: {} };\n",
});

if (!workerResult.success) {
  console.error("Worker build failed");
  for (const message of workerResult.logs) {
    console.error(message);
  }
  process.exit(1);
}

const workerCode = readFileSync(join(dist, "cli/cmd/tui/worker.js"), "utf-8");

// Build the main app bundle to handle JSX and plugins
console.log("Bundling main application...");
const mainResult = await build({
  entrypoints: [join(root, "src/index.ts")],
  outdir: dist,
  target: "bun",
  naming: "index.js",
  conditions: ["browser"],
  minify: true,
  plugins: [
    solidPlugin,
    {
      name: "transformers-stub",
      setup(b) {
        b.onResolve({ filter: /^@huggingface\/transformers$/ }, () => {
          return { path: join(root, "node_modules/@huggingface/transformers/dist/transformers.web.js") };
        });
        b.onResolve({ filter: /^onnxruntime-node$/ }, () => {
          return { path: join(root, "script/empty.js") };
        });
      },
    }
  ],
  external: bundlerExternals,
  alias: stubbedModules,
  define: {
    HDP_VERSION: JSON.stringify(version),
    HDP_CHANNEL: JSON.stringify("latest"),
    HDP_MIGRATIONS: JSON.stringify(migrations),
    HDP_WORKER_CODE: JSON.stringify(workerCode),
  },
});

if (!mainResult.success) {
  console.error("Main bundle failed");
  for (const message of mainResult.logs) console.error(message);
  process.exit(1);
}

// Compile standalone binaries
const targetArg = process.argv.find((arg) => arg.startsWith("--target="));

const platforms = [
  { target: "bun-linux-x64", name: "hdp-linux-x64" },
  { target: "bun-linux-arm64", name: "hdp-linux-arm64" },
  { target: "bun-darwin-x64", name: "hdp-macos-x64" },
  { target: "bun-darwin-arm64", name: "hdp-macos-arm64" },
  { target: "bun-windows-x64", name: "hdp-windows-x64.exe" },
];

console.log("\nCompiling binaries...");

// Build the --external flags as an array so Bun's shell splits them correctly.
const externalArgs = compilerExternals.flatMap((m) => ["--external", m]);

if (targetArg) {
  const target = targetArg.split("=")[1];
  const name = target.includes("windows") ? "hdp.exe" : "hdp";
  
  process.stdout.write(`  Building ${target} as ${name}... `);
  
  const parts = target.split('-');
  const arch = parts[2];
  const platform = parts[1] === "darwin" ? "darwin" : parts[1] === "windows" ? "win32" : parts[1];
  
  const content = await Bun.file(join(dist, "index.js")).text();
  const patchedContent = content.replace(
    /\`@opentui\/core-\$\{process\.platform\}-\$\{process\.arch\}\/index\.ts\`/g,
    `'@opentui/core-${platform}-${arch}/index.ts'`
  );
  const tempEntry = join(dist, `index_${target}.js`);
  await Bun.write(tempEntry, patchedContent);
  
  await $`bun build ${tempEntry} --compile --target ${target} --outfile ${join(dist, name)} ${externalArgs}`.quiet();
  console.log("✅");
} else {
  for (const { target, name } of platforms) {
    try {
      process.stdout.write(`  Building ${name}... `);
      
      const parts = target.split('-');
      const arch = parts[2];
      const platform = parts[1] === "darwin" ? "darwin" : parts[1] === "windows" ? "win32" : parts[1];
      
      const content = await Bun.file(join(dist, "index.js")).text();
      const patchedContent = content.replace(
        /\`@opentui\/core-\$\{process\.platform\}-\$\{process\.arch\}\/index\.ts\`/g,
        `'@opentui/core-${platform}-${arch}/index.ts'`
      );
      const tempEntry = join(dist, `index_${target}.js`);
      await Bun.write(tempEntry, patchedContent);
      
      await $`bun build ${tempEntry} --compile --target ${target} --outfile ${join(dist, name)} ${externalArgs}`.quiet();
      console.log("✅");
    } catch (e) {
      console.log("❌");
    }
  }
}

console.log("\nBuild successful!");
