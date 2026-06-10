import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildModeCommand, parseRunModeArgs, runMode } from "../scripts/run-mode.js";

const roots = [];

function tempRoot() {
  const root = mkdtempSync(join(tmpdir(), "graham-run-mode-"));
  roots.push(root);
  return root;
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("run mode", () => {
  it("parses watch mode arguments", () => {
    expect(parseRunModeArgs(["node", "run-mode.js", "--mode", "watch", "--interval-minutes", "5", "--no-telegram"])).toEqual({
      mode: "watch",
      intervalMinutes: 5,
      dryRun: false,
      noTelegram: true,
    });
  });

  it("builds commands without exposing credentials", () => {
    expect(buildModeCommand({ mode: "once", noTelegram: true })).toEqual(["npm", ["run", "weekly:screen", "--", "--no-telegram"]]);
    expect(buildModeCommand({ mode: "dashboard" })).toEqual(["npm", ["run", "dev:safe"]]);
  });

  it("writes a heartbeat in dry-run mode", async () => {
    const result = await runMode(["node", "run-mode.js", "--mode", "watch", "--dry-run"], { root: tempRoot() });

    expect(result.dryRun).toBe(true);
    expect(result.mode).toBe("watch");
    expect(result.command).toBe("npm run weekly:screen");
    expect(result.heartbeatPath).toContain(".local_runtime");
  });
});
