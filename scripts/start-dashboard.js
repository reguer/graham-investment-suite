import { spawn } from "node:child_process";
import net from "node:net";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initRuntime } from "./init-runtime.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const runLocalBinPath = join(__dirname, "run-local-bin.js");

export function parseArgs(argv) {
  const args = {
    host: "127.0.0.1",
    basePort: 5173,
    dryRun: false,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") args.dryRun = true;
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

export async function startDashboard(argv = process.argv) {
  const args = parseArgs(argv);
  const runtime = initRuntime();
  const port = await findAvailablePort(args.basePort, args.host);
  const url = `http://${args.host}:${port}/`;

  if (args.dryRun) {
    return { port, url, runtimeDir: runtime.runtimeDir, dryRun: true };
  }

  console.log(`Dashboard local: ${url}`);
  console.log("Usa Ctrl+C para detener este proceso.");

  const child = spawn(process.execPath, [runLocalBinPath, "vite", "--host", args.host, "--port", String(port)], {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: false,
  });

  child.on("exit", (code) => {
    process.exitCode = code ?? 0;
  });

  return { port, url, runtimeDir: runtime.runtimeDir, child };
}

const isCli = process.argv[1] && process.argv[1].endsWith("start-dashboard.js");
if (isCli) {
  startDashboard().then((result) => {
    if (result.dryRun) console.log(JSON.stringify(result, null, 2));
  }).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
