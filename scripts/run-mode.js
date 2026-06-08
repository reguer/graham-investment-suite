import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { initRuntime } from "./init-runtime.js";

const DEFAULT_INTERVAL_MINUTES = 15;

export function parseRunModeArgs(argv) {
  const args = { mode: "once", intervalMinutes: DEFAULT_INTERVAL_MINUTES, dryRun: false, noTelegram: false };
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--mode") args.mode = String(argv[index + 1] || "once").trim().toLowerCase();
    if (argv[index] === "--interval-minutes") args.intervalMinutes = Number(argv[index + 1] || DEFAULT_INTERVAL_MINUTES);
    if (argv[index] === "--dry-run") args.dryRun = true;
    if (argv[index] === "--no-telegram") args.noTelegram = true;
  }
  if (!["once", "watch", "dashboard"].includes(args.mode)) throw new Error("Modo no soportado. Usa once, watch o dashboard.");
  if (!Number.isFinite(args.intervalMinutes) || args.intervalMinutes < 1) throw new Error("--interval-minutes debe ser mayor o igual a 1.");
  return args;
}

export function buildModeCommand(args) {
  if (args.mode === "dashboard") return ["npm", ["run", "dev:safe"]];
  const commandArgs = ["run", "weekly:screen"];
  if (args.noTelegram) commandArgs.push("--", "--no-telegram");
  return ["npm", commandArgs];
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: process.cwd(), stdio: "inherit", shell: process.platform === "win32" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} termino con codigo ${code}`));
    });
  });
}

export async function runMode(argv = process.argv, { runner = runCommand, setTimer = setInterval, root = process.cwd() } = {}) {
  const args = parseRunModeArgs(argv);
  const runtime = initRuntime({ root });
  const [command, commandArgs] = buildModeCommand(args);
  const heartbeatPath = join(runtime.runtimeDir, "heartbeat.json");
  const heartbeat = {
    mode: args.mode,
    intervalMinutes: args.intervalMinutes,
    device: runtime.device,
    command: `${command} ${commandArgs.join(" ")}`,
    startedAt: new Date().toISOString(),
  };
  writeFileSync(heartbeatPath, `${JSON.stringify(heartbeat, null, 2)}\n`, "utf8");

  if (args.dryRun) return { ...heartbeat, dryRun: true, heartbeatPath };
  if (args.mode === "watch") {
    await runner(command, commandArgs);
    setTimer(() => runner(command, commandArgs).catch((error) => console.error(error.message)), args.intervalMinutes * 60 * 1000);
    return { ...heartbeat, heartbeatPath };
  }
  await runner(command, commandArgs);
  return { ...heartbeat, heartbeatPath };
}

const isCli = process.argv[1] && process.argv[1].endsWith("run-mode.js");
if (isCli) {
  runMode().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
