import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const runtimeDir = join(process.cwd(), ".local_runtime");
const devicePath = join(runtimeDir, "device.json");

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

export function initRuntime({ now = new Date() } = {}) {
  mkdirSync(runtimeDir, { recursive: true });
  for (const folder of ["logs", "locks", "pids"]) {
    mkdirSync(join(runtimeDir, folder), { recursive: true });
  }

  const existingDevice = existsSync(devicePath) ? readJson(devicePath) : null;
  const device = existingDevice || {
    device_id: randomUUID(),
    device_name: hostname(),
    device_role: "secondary",
    created_at: now.toISOString(),
  };

  if (!existingDevice) {
    writeFileSync(devicePath, `${JSON.stringify(device, null, 2)}\n`, "utf8");
  }

  return {
    runtimeDir,
    devicePath,
    device,
    createdDevice: !existingDevice,
  };
}

const isCli = process.argv[1] && process.argv[1].endsWith("init-runtime.js");
if (isCli) {
  const result = initRuntime();
  console.log(`Runtime local listo: ${result.runtimeDir}`);
  console.log(`Device: ${result.device.device_name} (${result.device.device_id})`);
  console.log(result.createdDevice ? "device.json creado" : "device.json existente conservado");
}
