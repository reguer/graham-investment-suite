import { describe, expect, it } from "vitest";
import { auditGitignore, auditTrackedFiles } from "../scripts/security-audit.js";

describe("security audit", () => {
  it("detects missing gitignore patterns", () => {
    const result = auditGitignore(".env\n.local_runtime/\n");
    expect(result.ok).toBe(false);
    expect(result.missing).toContain("data/cache/");
  });

  it("rejects tracked sensitive runtime files", () => {
    const result = auditTrackedFiles(["src/App.jsx", ".env.local", "data/cache/company.json", "data/graham_suite.db"]);
    expect(result.ok).toBe(false);
    expect(result.forbidden).toEqual([".env.local", "data/cache/company.json", "data/graham_suite.db"]);
  });

  it("allows ordinary tracked project files", () => {
    expect(auditTrackedFiles([".env.example", "src/App.jsx", "data/public/companies.json", "reports/weekly/2026-06-08.md"]).ok).toBe(true);
  });
});
