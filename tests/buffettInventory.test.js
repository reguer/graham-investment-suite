import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { BUFFETT_METRIC_INVENTORY, QUALITY_METRIC_STATUS, collectPublicBuffettCoverage } from "../src/tools/watchlist/qualityMetrics.js";
import { normalizeExportedCompany } from "../src/tools/watchlist/watchlist.js";

const publicCompanies = JSON.parse(readFileSync("data/public/companies.json", "utf8")).map(normalizeExportedCompany);
const coverageById = Object.fromEntries(collectPublicBuffettCoverage(publicCompanies).map((entry) => [entry.id, entry]));

describe("buffett metric inventory", () => {
  it("documents only automatic Buffett inputs with SEC primary and Yahoo fallback", () => {
    expect(BUFFETT_METRIC_INVENTORY.some((entry) => entry.id === "revenue" && entry.primarySource === "SEC Company Facts")).toBe(true);
    expect(BUFFETT_METRIC_INVENTORY.some((entry) => entry.id === "operatingCF" && entry.fallbackSource === "Yahoo annual / TTM")).toBe(true);
    expect(BUFFETT_METRIC_INVENTORY.some((entry) => entry.id === "sharesOutstanding" && entry.asOfField === "sourceDate")).toBe(true);
  });

  it("reflects the current public export coverage without inventing missing Buffett fields", () => {
    expect(coverageById.netIncome.publicExportStatus).toBe(QUALITY_METRIC_STATUS.partial);
    expect(coverageById.netIncome.count).toBeGreaterThan(100);
    expect(coverageById.netIncome.count).toBeLessThan(publicCompanies.length);

    expect(coverageById.operatingCF.publicExportStatus).toBe(QUALITY_METRIC_STATUS.partial);
    expect(coverageById.operatingCF.count).toBeGreaterThan(100);
    expect(coverageById.operatingCF.count).toBeLessThan(publicCompanies.length);

    expect(coverageById.sharesOutstanding.publicExportStatus).toBe(QUALITY_METRIC_STATUS.partial);
    expect(coverageById.sharesOutstanding.count).toBeGreaterThan(100);
    expect(coverageById.sharesOutstanding.count).toBeLessThan(publicCompanies.length);
  });

  it("keeps still-missing Buffett export fields explicitly marked as missing", () => {
    expect(coverageById.revenue.publicExportStatus).toBe(QUALITY_METRIC_STATUS.missing);
    expect(coverageById.revenue.count).toBe(0);
    expect(coverageById.capex.publicExportStatus).toBe(QUALITY_METRIC_STATUS.missing);
    expect(coverageById.capex.count).toBe(0);
    expect(coverageById.depreciationAmortization.count).toBe(0);
    expect(coverageById.cash.count).toBe(0);
    expect(coverageById.totalDebt.count).toBe(0);
  });
});
