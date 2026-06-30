import { spawn } from "node:child_process";
import { existsSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import net from "node:net";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initRuntime } from "./init-runtime.js";
import { findPreferredNode } from "./node-runtime.js";
import { buildLocalBinEnv, resolveLocalCommand } from "./run-local-bin.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const runLocalBinPath = join(__dirname, "run-local-bin.js");

export function parseArgs(argv) {
  const args = {
    host: "127.0.0.1",
    basePort: 5173,
    background: true,
    dryRun: false,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") args.dryRun = true;
    if (arg === "--foreground" || arg === "--attached") args.background = false;
    if (arg === "--background") args.background = true;
    if (arg === "--host") args.host = argv[index + 1] || args.host;
    if (arg === "--port" || arg === "--base-port") args.basePort = Number(argv[index + 1] || args.basePort);
  }

  if (!Number.isInteger(args.basePort) || args.basePort < 1 || args.basePort > 65535) {
    throw new Error(`Puerto invalido: ${args.basePort}`);
  }

  return args;
}

export function isPortAvailable(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

export async function findAvailablePort(basePort = 5173, host = "127.0.0.1", maxAttempts = 50) {
  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const port = basePort + offset;
    if (await isPortAvailable(port, host)) return port;
  }
  throw new Error(`No hay puerto libre entre ${basePort} y ${basePort + maxAttempts - 1}`);
}

export function writePidFile(pidPath, pid) {
  writeFileSync(pidPath, `${pid}\n`, "utf8");
}

export function writeDashboardMeta(metaPath, payload) {
  writeFileSync(metaPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export function readDashboardMeta(metaPath) {
  if (!existsSync(metaPath)) return null;
  try {
    return JSON.parse(readFileSync(metaPath, "utf8"));
  } catch {
    return null;
  }
}

export function clearPidFile(pidPath, pid) {
  if (!existsSync(pidPath)) return false;
  const storedPid = readFileSync(pidPath, "utf8").trim();
  if (storedPid !== String(pid)) return false;
  rmSync(pidPath, { force: true });
  return true;
}

export function isProcessRunning(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function buildDashboardLaunch(commandPath, nodePath, host, port, background, stdoutPath, stderrPath) {
  if (background) {
    const resolved = resolveLocalCommand("vite", ["--host", host, "--port", String(port)], nodePath);
    if (!resolved) {
      throw new Error("No se encontro el binario local de vite.");
    }

    return {
      command: resolved.command,
      args: resolved.commandArgs,
      options: {
        cwd: process.cwd(),
        stdio: [
          "ignore",
          openSync(stdoutPath, "a"),
          openSync(stderrPath, "a"),
        ],
        env: resolved.env,
        shell: false,
        detached: true,
        windowsHide: true,
      },
    };
  }

  return {
    command: nodePath,
    args: [commandPath, "vite", "--host", host, "--port", String(port)],
    options: {
      cwd: process.cwd(),
      stdio: "inherit",
      env: buildLocalBinEnv(),
      shell: false,
      detached: false,
      windowsHide: false,
    },
  };
}

export async function startDashboard(argv = process.argv) {
  const args = parseArgs(argv);
  const runtime = initRuntime();
  const port = await findAvailablePort(args.basePort, args.host);
  const url = `http://${args.host}:${port}/`;
  const pidPath = join(runtime.runtimeDir, "dashboard.pid");
  const metaPath = join(runtime.runtimeDir, "dashboard.json");
  const stdoutPath = join(runtime.logsDir, "dashboard.stdout.log");
  const stderrPath = join(runtime.logsDir, "dashboard.stderr.log");
  const existingPid = existsSync(pidPath) ? Number(readFileSync(pidPath, "utf8").trim()) : null;
  const existingMeta = readDashboardMeta(metaPath);

  if (isProcessRunning(existingPid)) {
    return {
      alreadyRunning: true,
      pid: existingPid,
      pidPath,
      metaPath,
      url: existingMeta?.url || "",
      logPaths: existingMeta?.logPaths || { stdoutPath, stderrPath },
      background: existingMeta?.background ?? true,
    };
  }

  if (existingPid && !isProcessRunning(existingPid)) {
    rmSync(pidPath, { force: true });
    rmSync(metaPath, { force: true });
  }

  if (args.dryRun) {
    return { port, url, runtimeDir: runtime.runtimeDir, pidPath, metaPath, stdoutPath, stderrPath, dryRun: true, background: args.background };
  }

  const nodePath = findPreferredNode(process.env);
  const launch = buildDashboardLaunch(
    runLocalBinPath,
    nodePath,
    args.host,
    port,
    args.background,
    stdoutPath,
    stderrPath,
  );
  const child = spawn(launch.command, launch.args, launch.options);
  writePidFile(pidPath, child.pid);
  writeDashboardMeta(metaPath, {
    pid: child.pid,
    url,
    host: args.host,
    port,
    background: args.background,
    startedAt: new Date().toISOString(),
    pidPath,
    logPaths: { stdoutPath, stderrPath },
  });

  if (args.background) {
    child.unref();
    console.log(`Dashboard local activo en segundo plano: ${url}`);
    console.log(`PID registrado: ${pidPath}`);
    console.log(`Logs: ${stdoutPath} | ${stderrPath}`);
    console.log("Puedes cerrar esta ventana de PowerShell.");
    console.log("Para detenerlo: npm run dev:stop");
    return { port, url, runtimeDir: runtime.runtimeDir, pidPath, metaPath, background: true, child };
  }

  console.log(`Dashboard local: ${url}`);
  console.log("Usa Ctrl+C para detener este proceso.");
  console.log(`PID registrado: ${pidPath}`);

  child.on("exit", (code) => {
    clearPidFile(pidPath, child.pid);
    rmSync(metaPath, { force: true });
    process.exitCode = code ?? 0;
  });

  return { port, url, runtimeDir: runtime.runtimeDir, pidPath, metaPath, background: false, child };
}

const isCli = process.argv[1] && process.argv[1].endsWith("start-dashboard.js");
if (isCli) {
  startDashboard().then((result) => {
    if (result.dryRun || result.alreadyRunning) console.log(JSON.stringify(result, null, 2));
  }).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
