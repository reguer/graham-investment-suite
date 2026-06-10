import { spawnSync } from "node:child_process";
import { dirname } from "node:path";
import { findPreferredNode } from "./node-runtime.js";

const [script, ...args] = process.argv.slice(2);
if (!script) {
  console.error("Uso: node scripts/run-node22.js <script> [...args]");
  process.exit(1);
}

const nodePath = findPreferredNode();
const env = { ...process.env, PATH: `${dirname(nodePath)};${process.env.PATH || ""}` };
const result = spawnSync(nodePath, [script, ...args], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
  shell: false,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
