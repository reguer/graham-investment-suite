import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export function getRuntimePaths(root = process.cwd()) {
  const runtimeDir = join(root, ".local_runtime");
  return {
    runtimeDir,
    devicePath: join(runtimeDir, "device.json"),
    logsDir: join(runtimeDir, "logs"),
    locksDir: join(runtimeDir, "locks"),
    pidsDir: join(runtimeDir, "pids"),
  };
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

export function initRuntime({ now = new Date(), root = process.cwd() } = {}) {
  const { runtimeDir, devicePath, logsDir, locksDir, pidsDir } = getRuntimePaths(root);
  mkdirSync(runtimeDir, { recursive: true });
  for (const folder of [logsDir, locksDir, pidsDir]) {
    mkdirSync(folder, { recursive: true });
  }

  const existingDevice = existsSync(devicePath) ? readJson(devicePath) : null;
  const device = existingDevice || {
    device_id: randomUUID(),
    device_name: hostname(),
    device_role: "secondary",
    auto_push_enabled: false,
    created_at: now.toISOString(),
  };

  if (!existingDevice) {
    writeFileSync(devicePath, `${JSON.stringify(device, null, 2)}\n`, "utf8");
  }

  return {
    runtimeDir,
    devicePath,
    logsDir,
    locksDir,
    pidsDir,
    device,
    createdDevice: !existingDevice,
  };
}

export function getDeviceLabel(device = {}) {
  const name = device.device_name || "Equipo local";
  const id = device.device_id || "sin-device-id";
  const role = device.device_role || "secondary";
  return `${name} (${id}, rol: ${role})`;
}

const isCli = process.argv[1] && process.argv[1].endsWith("init-runtime.js");
if (isCli) {
  const result = initRuntime();
  console.log(`Runtime local listo: ${result.runtimeDir}`);
  console.log(`Device: ${result.device.device_name} (${result.device.device_id})`);
  console.log(result.createdDevice ? "device.json creado" : "device.json existente conservado");
}
