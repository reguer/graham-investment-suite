import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { initRuntime } from "./init-runtime.js";

export function parseArgs(argv) {
  return {
    dryRun: argv.includes("--dry-run"),
  };
}

export function readDashboardPid(pidPath) {
  if (!existsSync(pidPath)) return null;
  const pid = Number(readFileSync(pidPath, "utf8").trim());
  return Number.isInteger(pid) && pid > 0 ? pid : null;
}

export function stopDashboard(argv = process.argv) {
  const args = parseArgs(argv);
  const runtime = initRuntime();
  const pidPath = join(runtime.runtimeDir, "dashboard.pid");
  const pid = readDashboardPid(pidPath);

  if (!pid) {
    return { ok: false, pid: null, pidPath, message: "No hay PID de dashboard registrado." };
  }

  if (args.dryRun) {
    return { ok: true, pid, pidPath, dryRun: true, message: `Se detendria el PID ${pid}.` };
  }

  process.kill(pid, "SIGTERM");
  rmSync(pidPath, { force: true });
  return { ok: true, pid, pidPath, message: `Dashboard detenido: PID ${pid}.` };
}

const isCli = process.argv[1] && process.argv[1].endsWith("stop-dashboard.js");
if (isCli) {
  try {
    const result = stopDashboard();
    console.log(result.message);
    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    console.error(`No se pudo detener el dashboard: ${error.message}`);
    process.exit(1);
  }
}
