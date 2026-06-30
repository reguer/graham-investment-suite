import net from "node:net";
import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildDashboardLaunch, clearPidFile, findAvailablePort, isProcessRunning, parseArgs, readDashboardMeta, writeDashboardMeta, writePidFile } from "../scripts/start-dashboard.js";

function listenOn(port, host = "127.0.0.1") {
  const server = net.createServer();
  return new Promise((resolve) => {
    server.listen(port, host, () => resolve(server));
  });
}

describe("start-dashboard", () => {
  it("parses dry-run and base port", () => {
    expect(parseArgs(["node", "script", "--dry-run", "--base-port", "5200"])).toEqual({
      host: "127.0.0.1",
      basePort: 5200,
      background: true,
      dryRun: true,
    });
  });

  it("allows foreground mode for debugging", () => {
    expect(parseArgs(["node", "script", "--foreground"])).toEqual({
      host: "127.0.0.1",
      basePort: 5173,
      background: false,
      dryRun: false,
    });
  });

  it("uses the next free port when the base port is occupied", async () => {
    const server = await listenOn(55321);
    try {
      await expect(findAvailablePort(55321, "127.0.0.1", 3)).resolves.toBe(55322);
    } finally {
      server.close();
    }
  });

  it("writes and clears only the matching dashboard pid", () => {
    const dir = mkdtempSync(join(tmpdir(), "graham-pid-"));
    const pidPath = join(dir, "dashboard.pid");
    writePidFile(pidPath, 12345);
    expect(readFileSync(pidPath, "utf8").trim()).toBe("12345");
    expect(clearPidFile(pidPath, 99999)).toBe(false);
    expect(clearPidFile(pidPath, 12345)).toBe(true);
  });

  it("writes and reads dashboard metadata", () => {
    const dir = mkdtempSync(join(tmpdir(), "graham-meta-"));
    const metaPath = join(dir, "dashboard.json");
    writeDashboardMeta(metaPath, { pid: 12345, url: "http://127.0.0.1:5173/" });
    expect(readDashboardMeta(metaPath)).toEqual({ pid: 12345, url: "http://127.0.0.1:5173/" });
  });

  it("recognizes the current process as running", () => {
    expect(isProcessRunning(process.pid)).toBe(true);
  });

  it("launches vite directly for background mode to avoid inheriting a console", () => {
    const dir = mkdtempSync(join(tmpdir(), "graham-logs-"));
    const launch = buildDashboardLaunch(
      "C:\\repo\\scripts\\run-local-bin.js",
      "C:\\node\\node.exe",
      "127.0.0.1",
      5173,
      true,
      join(dir, "stdout.log"),
      join(dir, "stderr.log"),
    );

    expect(launch.command).toBe("C:\\node\\node.exe");
    expect(launch.args[0]).toContain("vite");
    expect(launch.args).not.toContain("C:\\repo\\scripts\\run-local-bin.js");
    expect(launch.options.detached).toBe(true);
    expect(launch.options.windowsHide).toBe(true);
    expect(Array.isArray(launch.options.stdio)).toBe(true);
  });

  it("keeps the wrapper path for foreground debugging", () => {
    const launch = buildDashboardLaunch(
      "C:\\repo\\scripts\\run-local-bin.js",
      "C:\\node\\node.exe",
      "127.0.0.1",
      5173,
      false,
      "stdout.log",
      "stderr.log",
    );

    expect(launch.command).toBe("C:\\node\\node.exe");
    expect(launch.args).toEqual([
      "C:\\repo\\scripts\\run-local-bin.js",
      "vite",
      "--host",
      "127.0.0.1",
      "--port",
      "5173",
    ]);
    expect(launch.options.stdio).toBe("inherit");
    expect(launch.options.detached).toBe(false);
  });
});
