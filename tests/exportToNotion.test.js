import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildNotionCompanyPage, buildNotionPayload, exportToNotion, parseNotionExportArgs } from "../scripts/export-to-notion.js";

const roots = [];

function tempRoot() {
  const root = mkdtempSync(join(tmpdir(), "graham-notion-"));
  roots.push(root);
  return root;
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("export-to-notion", () => {
  it("builds Notion page properties from company data", () => {
    const page = buildNotionCompanyPage({ ticker: "KBH", companyName: "KB Home", price: 50, pe: 10, tags: ["graham-approved"] });

    expect(page.properties.Ticker.title[0].text.content).toBe("KBH");
    expect(page.properties["P/E"].number).toBe(10);
    expect(page.properties.Tags.multi_select[0].name).toBe("graham-approved");
  });

  it("limits payload pages and uses database id placeholder in dry-run payload", () => {
    const payload = buildNotionPayload([{ ticker: "A" }, { ticker: "B" }], { limit: 1 });

    expect(payload.count).toBe(1);
    expect(payload.pages[0].parent.database_id).toBe("NOTION_DATABASE_ID");
  });

  it("writes a dry-run payload without requiring secrets", async () => {
    const root = tempRoot();
    const input = join(root, "companies.json");
    const out = join(root, "notion.json");
    writeFileSync(input, JSON.stringify([{ ticker: "KBH", companyName: "KB Home" }]), "utf8");

    const result = await exportToNotion(parseNotionExportArgs(["node", "export-to-notion.js", "--input", input, "--out", out, "--dry-run"]), { env: {} });

    expect(result.dryRun).toBe(true);
    expect(JSON.parse(readFileSync(out, "utf8")).count).toBe(1);
  });
});
