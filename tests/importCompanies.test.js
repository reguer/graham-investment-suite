import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { dedupeCompanies, parseImportFile } from "../scripts/import-companies.js";

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

  it("detects duplicate tickers in an import batch", () => {
    const { companies, duplicateTickers } = dedupeCompanies([
      { ticker: "MSFT", companyName: "Microsoft" },
      { ticker: "MSFT", companyName: "Microsoft duplicate" },
      { ticker: "AAPL", companyName: "Apple" },
    ]);

    expect(companies.map((company) => company.ticker)).toEqual(["MSFT", "AAPL"]);
    expect(duplicateTickers).toEqual(["MSFT"]);
  });
});
