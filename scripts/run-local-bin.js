import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const [binName, ...args] = process.argv.slice(2);

if (!binName) {
  console.error("Usage: node scripts/run-local-bin.js <bin> [...args]");
  process.exit(1);
}

const directBins = {
  vite: ["vite", "bin", "vite.js"],
  vitest: ["vitest", "vitest.mjs"],
};

const extension = process.platform === "win32" ? ".cmd" : "";
const moduleRoots = [
  join(process.cwd(), "node_modules"),
  join(process.cwd(), ".yarn_node_modules"),
  join(process.cwd(), ".local_node_modules"),
  "C:\\npm-cache\\graham-repair\\node_modules",
];
const directCandidates = directBins[binName]
  ? moduleRoots.map((root) => join(root, ...directBins[binName]))
  : [];
const shimCandidates = moduleRoots.map((root) => join(root, ".bin", `${binName}${extension}`));
const candidates = [...directCandidates, ...shimCandidates];

const binary = candidates.find((candidate) => existsSync(candidate));

if (!binary) {
  console.error(`Could not find local binary: ${binName}`);
  console.error("Run npm install, or yarn install --modules-folder .yarn_node_modules.");
  process.exit(1);
}

const env = {
    ...process.env,
    NODE_PATH: [
      join(process.cwd(), "node_modules"),
      join(process.cwd(), ".yarn_node_modules"),
      join(process.cwd(), ".local_node_modules"),
      "C:\\npm-cache\\graham-repair\\node_modules",
      process.env.NODE_PATH,
    ].filter(Boolean).join(process.platform === "win32" ? ";" : ":"),
  };

const esbuildFallback =
  process.platform === "win32" ? "C:\\npm-cache\\graham-tools\\esbuild-0.21.5.exe" : "";
if (!env.ESBUILD_BINARY_PATH && esbuildFallback && existsSync(esbuildFallback)) {
  env.ESBUILD_BINARY_PATH = esbuildFallback;
}

const isJavaScriptBin = binary.endsWith(".js") || binary.endsWith(".mjs") || binary.endsWith(".cjs");
const isCmdShim = process.platform === "win32" && binary.endsWith(".cmd");
const command = isJavaScriptBin ? process.execPath : isCmdShim ? "cmd.exe" : binary;
const commandArgs = isJavaScriptBin
  ? [binary, ...args]
  : isCmdShim
    ? ["/d", "/s", "/c", `"${binary}" ${args.map((arg) => `"${arg}"`).join(" ")}`]
    : args;

const child = spawn(command, commandArgs, {
  stdio: "inherit",
  env,
  shell: false,
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
