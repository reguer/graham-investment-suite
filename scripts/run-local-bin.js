import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const directBins = {
  vite: ["vite", "bin", "vite.js"],
  vitest: ["vitest", "vitest.mjs"],
};

export const extension = process.platform === "win32" ? ".cmd" : "";
export const moduleRoots = [
  join(process.cwd(), "node_modules"),
  join(process.cwd(), ".yarn_node_modules"),
  join(process.cwd(), ".local_node_modules"),
  "C:\\npm-cache\\graham-repair\\node_modules",
];

export function resolveLocalBinary(binName) {
  const directCandidates = directBins[binName]
    ? moduleRoots.map((root) => join(root, ...directBins[binName]))
    : [];
  const shimCandidates = moduleRoots.map((root) => join(root, ".bin", `${binName}${extension}`));
  const candidates = [...directCandidates, ...shimCandidates];
  return candidates.find((candidate) => existsSync(candidate)) || null;
}

export function buildLocalBinEnv(baseEnv = process.env) {
  const env = {
    ...baseEnv,
    NODE_PATH: [
      join(process.cwd(), "node_modules"),
      join(process.cwd(), ".yarn_node_modules"),
      join(process.cwd(), ".local_node_modules"),
      "C:\\npm-cache\\graham-repair\\node_modules",
      baseEnv.NODE_PATH,
    ].filter(Boolean).join(process.platform === "win32" ? ";" : ":"),
  };

  const esbuildFallback =
    process.platform === "win32" ? "C:\\npm-cache\\graham-tools\\esbuild-0.21.5.exe" : "";
  if (!env.ESBUILD_BINARY_PATH && esbuildFallback && existsSync(esbuildFallback)) {
    env.ESBUILD_BINARY_PATH = esbuildFallback;
  }

  return env;
}

export function resolveLocalCommand(binName, args = [], nodePath = process.execPath) {
  const binary = resolveLocalBinary(binName);
  if (!binary) return null;

  const isJavaScriptBin = binary.endsWith(".js") || binary.endsWith(".mjs") || binary.endsWith(".cjs");
  const isCmdShim = process.platform === "win32" && binary.endsWith(".cmd");
  const command = isJavaScriptBin ? nodePath : isCmdShim ? "cmd.exe" : binary;
  const commandArgs = isJavaScriptBin
    ? [binary, ...args]
    : isCmdShim
      ? ["/d", "/s", "/c", `"${binary}" ${args.map((arg) => `"${arg}"`).join(" ")}`]
      : args;

  return {
    binary,
    command,
    commandArgs,
    env: buildLocalBinEnv(),
  };
}

function runCli() {
  const [binName, ...args] = process.argv.slice(2);

  if (!binName) {
    console.error("Usage: node scripts/run-local-bin.js <bin> [...args]");
    process.exit(1);
  }

  const resolved = resolveLocalCommand(binName, args);
  if (!resolved) {
    console.error(`Could not find local binary: ${binName}`);
    console.error("Run npm install, or yarn install --modules-folder .yarn_node_modules.");
    process.exit(1);
  }

  const child = spawn(resolved.command, resolved.commandArgs, {
    stdio: "inherit",
    env: resolved.env,
    shell: false,
  });

  child.on("exit", (code) => {
    process.exit(code ?? 1);
  });
}

const isCli = process.argv[1] && process.argv[1].endsWith("run-local-bin.js");
if (isCli) runCli();
