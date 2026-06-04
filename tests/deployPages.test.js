import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { parseArgs, scanDistForSecrets } from "../scripts/deploy-pages.js";

describe("deploy-pages", () => {
  it("parses dry-run and allow-dirty flags", () => {
    expect(parseArgs(["node", "script", "--dry-run", "--allow-dirty"])).toEqual({
      dryRun: true,
      allowDirty: true,
    });
  });

  it("detects secret-shaped values in dist", () => {
    const dir = mkdtempSync(join(tmpdir(), "graham-dist-"));
    writeFileSync(join(dir, "index.js"), "const key = 'sk-test_secret_value_1234567890';", "utf8");
    expect(scanDistForSecrets(dir)).toHaveLength(1);
  });

  it("allows harmless public bundle text", () => {
    const dir = mkdtempSync(join(tmpdir(), "graham-dist-"));
    writeFileSync(join(dir, "index.js"), "const name = 'VITE_ANTHROPIC_API_KEY';", "utf8");
    expect(scanDistForSecrets(dir)).toEqual([]);
  });
});
