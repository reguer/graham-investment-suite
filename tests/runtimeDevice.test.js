import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getDeviceLabel, initRuntime } from "../scripts/init-runtime.js";

const roots = [];

function tempRoot() {
  const root = mkdtempSync(join(tmpdir(), "graham-runtime-"));
  roots.push(root);
  return root;
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("runtime device", () => {
  it("creates local runtime folders and preserves device.json", () => {
    const root = tempRoot();
    const first = initRuntime({ root, now: new Date("2026-06-08T12:00:00Z") });
    const second = initRuntime({ root, now: new Date("2026-06-09T12:00:00Z") });

    expect(existsSync(first.logsDir)).toBe(true);
    expect(existsSync(first.locksDir)).toBe(true);
    expect(existsSync(first.pidsDir)).toBe(true);
    expect(first.createdDevice).toBe(true);
    expect(second.createdDevice).toBe(false);
    expect(second.device.device_id).toBe(first.device.device_id);
    expect(JSON.parse(readFileSync(first.devicePath, "utf8")).device_role).toBe("secondary");
  });

  it("formats a report-safe device label", () => {
    expect(getDeviceLabel({ device_name: "Laptop", device_id: "abc", device_role: "principal" })).toBe("Laptop (abc, rol: principal)");
  });
});
