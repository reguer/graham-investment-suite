import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, vi } from "vitest";
import { readDashboardPid, stopDashboard, stopDashboardProcess } from "../scripts/stop-dashboard.js";

describe("stop-dashboard", () => {
  it("reads a valid dashboard pid", () => {
    const dir = mkdtempSync(join(tmpdir(), "graham-stop-"));
    const pidPath = join(dir, "dashboard.pid");
    writeFileSync(pidPath, "12345\n", "utf8");
    expect(readDashboardPid(pidPath)).toBe(12345);
  });

  it("ignores a missing or invalid pid", () => {
    const dir = mkdtempSync(join(tmpdir(), "graham-stop-"));
    expect(readDashboardPid(join(dir, "missing.pid"))).toBeNull();
    const invalidPath = join(dir, "dashboard.pid");
    writeFileSync(invalidPath, "nope\n", "utf8");
    expect(readDashboardPid(invalidPath)).toBeNull();
  });

  it("cleans stale metadata when no dashboard pid is registered", () => {
    const root = mkdtempSync(join(tmpdir(), "graham-stop-"));
    const runtimeDir = join(root, ".local_runtime");
    mkdirSync(runtimeDir, { recursive: true });
    const metaPath = join(runtimeDir, "dashboard.json");
    writeFileSync(metaPath, "{}\n", "utf8");
    const result = stopDashboard(["node", "script"], { root });
    expect(result.ok).toBe(false);
    expect(existsSync(metaPath)).toBe(false);
  });

  it("cleans stale pid metadata when the process no longer exists", () => {
    const root = mkdtempSync(join(tmpdir(), "graham-stop-"));
    const runtimeDir = join(root, ".local_runtime");
    mkdirSync(runtimeDir, { recursive: true });
    const pidPath = join(runtimeDir, "dashboard.pid");
    const metaPath = join(runtimeDir, "dashboard.json");
    writeFileSync(pidPath, "999999\n", "utf8");
    writeFileSync(metaPath, "{}\n", "utf8");
    const result = stopDashboard(["node", "script"], { root });
    expect(result.ok).toBe(true);
    expect(existsSync(pidPath)).toBe(false);
    expect(existsSync(metaPath)).toBe(false);
  });

  it("uses taskkill on Windows to stop the whole dashboard tree", () => {
    const exec = vi.fn().mockReturnValue({
      status: 0,
      stdout: "",
      stderr: "",
    });

    stopDashboardProcess(12345, "win32", exec);

    expect(exec).toHaveBeenCalledWith("taskkill", ["/PID", "12345", "/T", "/F"], expect.objectContaining({
      shell: false,
      encoding: "utf8",
      stdio: "pipe",
    }));
  });
});
