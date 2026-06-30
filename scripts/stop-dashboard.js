import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import * as childProcess from "node:child_process";
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

export function stopDashboardProcess(pid, platform = process.platform, exec = childProcess.spawnSync) {
  if (platform === "win32") {
    const result = exec("taskkill", ["/PID", String(pid), "/T", "/F"], {
      stdio: "pipe",
      encoding: "utf8",
      shell: false,
    });
    if (result.status !== 0) {
      const output = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
      if (!/not found|no instance|cannot find|no se encontr[oó]/i.test(output)) {
        throw new Error(output || `taskkill fallo con codigo ${result.status}`);
      }
    }
    return;
  }

  try {
    process.kill(pid, "SIGTERM");
  } catch (error) {
    if (error?.code !== "ESRCH") throw error;
  }
}

export function stopDashboard(argv = process.argv, { root = process.cwd() } = {}) {
  const args = parseArgs(argv);
  const runtime = initRuntime({ root });
  const pidPath = join(runtime.runtimeDir, "dashboard.pid");
  const metaPath = join(runtime.runtimeDir, "dashboard.json");
  const pid = readDashboardPid(pidPath);

  if (!pid) {
    rmSync(metaPath, { force: true });
    return { ok: false, pid: null, pidPath, metaPath, message: "No hay PID de dashboard registrado." };
  }

  if (args.dryRun) {
    return { ok: true, pid, pidPath, metaPath, dryRun: true, message: `Se detendria el PID ${pid}.` };
  }

  stopDashboardProcess(pid);
  rmSync(pidPath, { force: true });
  rmSync(metaPath, { force: true });
  return { ok: true, pid, pidPath, metaPath, message: `Dashboard detenido: PID ${pid}.` };
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
