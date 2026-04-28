import { spawn } from "child_process";
const p = spawn(process.execPath, ["dist/index.js", "--version"]);
setTimeout(() => p.kill(), 3000);
