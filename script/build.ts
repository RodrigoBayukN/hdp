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

// Clean dist
try {
  rmSync(dist, { recursive: true, force: true });
} catch (e) {}
mkdirSync(dist, { recursive: true });

const nativeModules = ["onnxruntime-node", "node-pty", "tree-sitter", "fsevents", "sharp"];

// Build the worker first (referenced by src/cli/cmd/tui/thread.ts)
const workerResult = await build({
  entrypoints: [join(root, "src/cli/cmd/tui/worker.ts")],
  outdir: join(dist, "cli/cmd/tui"),
  target: "bun",
  naming: "[name].js",
  conditions: ["browser"],
  minify: true,
  plugins: [solidPlugin],
  external: nativeModules,
  define: {
    HDP_MIGRATIONS: JSON.stringify(migrations),
  },
});


if (!workerResult.success) {
  console.error("Worker build failed");
  for (const message of workerResult.logs) {
    console.error(message);
  }
  process.exit(1);
}

const workerCode = readFileSync(join(dist, "cli/cmd/tui/worker.js"), "utf-8");
const workerDataUrl = `data:text/javascript;base64,${Buffer.from(workerCode).toString("base64")}`;

// Build the main app bundle first to handle JSX and plugins
console.log("Bundling main application...");
const mainResult = await build({
  entrypoints: [join(root, "src/index.ts")],
  outdir: dist,
  target: "bun",
  naming: "index.js",
  conditions: ["browser"],
  minify: true,
  plugins: [solidPlugin],
  external: nativeModules,
  alias: {
    "@huggingface/transformers": join(root, "node_modules/@huggingface/transformers/dist/transformers.web.js"),
    "onnxruntime-node": join(root, "script/empty.js"),
    "sharp": join(root, "script/empty.js"),
  },
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
const isCI = process.env.GITHUB_ACTIONS === "true";
const targetArg = process.argv.find((arg) => arg.startsWith("--target="));

const platforms = [
  { target: "bun-linux-x64", name: "hdp-linux-x64" },
  { target: "bun-linux-arm64", name: "hdp-linux-arm64" },
  { target: "bun-darwin-x64", name: "hdp-macos-x64" },
  { target: "bun-darwin-arm64", name: "hdp-macos-arm64" },
  { target: "bun-windows-x64", name: "hdp-windows-x64.exe" },
];

console.log("\nCompiling binaries...");
const externals = nativeModules.map((m) => `--external ${m}`).join(" ");

if (targetArg) {
  const target = targetArg.split("=")[1];
  const name = target.includes("windows") ? "hdp.exe" : "hdp";
  process.stdout.write(`  Building ${target} as ${name}... `);
  await $`bun build ${join(dist, "index.js")} --compile --target ${target} --outfile ${join(dist, name)} ${externals}`.quiet();
  console.log("✅");
} else {
  for (const { target, name } of platforms) {
    try {
      process.stdout.write(`  Building ${name}... `);
      await $`bun build ${join(dist, "index.js")} --compile --target ${target} --outfile ${join(dist, name)} ${externals}`.quiet();
      console.log("✅");
    } catch (e) {
      console.log("❌");
    }
  }
}

console.log("\nBuild successful!");

