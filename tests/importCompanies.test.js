import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { parseImportFile } from "../scripts/import-companies.js";

describe("import companies", () => {
  it("parses json imports", () => {
    const dir = mkdtempSync(join(tmpdir(), "graham-import-"));
    const file = join(dir, "companies.json");
    writeFileSync(file, JSON.stringify([{ ticker: "MU", name: "Micron" }]), "utf8");
    expect(parseImportFile(file)[0].ticker).toBe("MU");
  });

  it("parses csv imports", () => {
    const dir = mkdtempSync(join(tmpdir(), "graham-import-"));
    const file = join(dir, "companies.csv");
    writeFileSync(file, "ticker,name,tags\nAAPL,Apple,\"core,tech\"\n", "utf8");
    const [company] = parseImportFile(file);
    expect(company.companyName).toBe("Apple");
    expect(company.tags).toEqual(["core", "tech"]);
  });
});
