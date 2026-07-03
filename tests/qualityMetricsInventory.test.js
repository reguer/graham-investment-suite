import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { collectPublicMetricCoverage, QUALITY_METRIC_INVENTORY, QUALITY_METRIC_STATUS } from "../src/tools/watchlist/qualityMetrics.js";
import { normalizeExportedCompany } from "../src/tools/watchlist/watchlist.js";

const publicCompanies = JSON.parse(readFileSync("data/public/companies.json", "utf8")).map(normalizeExportedCompany);
const coverageById = Object.fromEntries(collectPublicMetricCoverage(publicCompanies).map((entry) => [entry.id, entry]));

describe("quality metrics inventory", () => {
  it("documents automatic vs manual quality metrics without conflating moat with data that already exists", () => {
    expect(QUALITY_METRIC_INVENTORY.some((entry) => entry.id === "revenue" && entry.type === "automatic")).toBe(true);
    expect(QUALITY_METRIC_INVENTORY.some((entry) => entry.id === "moat" && entry.type === "manual")).toBe(true);
    expect(QUALITY_METRIC_INVENTORY.some((entry) => entry.id === "managementQuality" && entry.type === "manual")).toBe(true);
  });

  it("matches the current public export coverage for the key automatic metrics", () => {
    expect(coverageById.revenue.companiesJsonStatus).toBe(QUALITY_METRIC_STATUS.missing);
    expect(coverageById.revenue.count).toBe(0);

    expect(coverageById.eps.companiesJsonStatus).toBe(QUALITY_METRIC_STATUS.available);
    expect(coverageById.eps.count).toBeGreaterThan(300);

    expect(coverageById.fcf.companiesJsonStatus).toBe(QUALITY_METRIC_STATUS.available);
    expect(coverageById.fcf.count).toBeGreaterThan(300);

    expect(coverageById.sharesOutstanding.companiesJsonStatus).toBe(QUALITY_METRIC_STATUS.partial);
    expect(coverageById.sharesOutstanding.count).toBeGreaterThan(150);
    expect(coverageById.sharesOutstanding.count).toBeLessThan(publicCompanies.length);

    expect(coverageById.grossMargin.companiesJsonStatus).toBe(QUALITY_METRIC_STATUS.missing);
    expect(coverageById.grossMargin.count).toBe(0);
    expect(coverageById.operatingMargin.count).toBe(0);
    expect(coverageById.netMargin.count).toBe(0);
  });

  it("keeps manual-only moat style inputs out of the automatic export inventory", () => {
    expect(coverageById.moat.companiesJsonStatus).toBe(QUALITY_METRIC_STATUS.missing);
    expect(coverageById.moat.yahooSnapshotStatus).toBe(QUALITY_METRIC_STATUS.missing);
    expect(coverageById.moat.secSnapshotStatus).toBe(QUALITY_METRIC_STATUS.missing);
    expect(coverageById.contracts.count).toBe(0);
    expect(coverageById.regulation.count).toBe(0);
    expect(coverageById.managementQuality.count).toBe(0);
  });
});
