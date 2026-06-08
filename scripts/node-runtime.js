import { existsSync } from "node:fs";
import { join } from "node:path";

export const REQUIRED_NODE_MAJOR = 22;
export const PREFERRED_NODE_VERSION = "22.22.3";

export function findPreferredNode(env = process.env) {
  const currentMajor = Number(process.versions.node.split(".")[0]);
  if (currentMajor >= REQUIRED_NODE_MAJOR) return process.execPath;

  const appData = env.APPDATA || "";
  const nvmNode = appData ? join(appData, "nvm", `v${PREFERRED_NODE_VERSION}`, "node.exe") : "";
  if (nvmNode && existsSync(nvmNode)) return nvmNode;

  return process.execPath;
}

export function isPreferredNodeActive() {
  return Number(process.versions.node.split(".")[0]) >= REQUIRED_NODE_MAJOR;
}
