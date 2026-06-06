import { describe, expect, it } from "vitest";
import { buildSecGrahamSnapshot, hasMinimumGrahamSnapshot } from "../src/tools/watchlist/secFundamentals.js";

const companyFacts = {
  facts: {
    "us-gaap": {
      Assets: { units: { USD: [{ end: "2025-12-31", val: 1000, filed: "2026-02-01" }] } },
      AssetsCurrent: { units: { USD: [{ end: "2025-12-31", val: 600, filed: "2026-02-01" }] } },
      InventoryNet: { units: { USD: [{ end: "2025-12-31", val: 100, filed: "2026-02-01" }] } },
      Liabilities: { units: { USD: [{ end: "2025-12-31", val: 400, filed: "2026-02-01" }] } },
      LiabilitiesCurrent: { units: { USD: [{ end: "2025-12-31", val: 200, filed: "2026-02-01" }] } },
      StockholdersEquity: { units: { USD: [{ end: "2025-12-31", val: 600, filed: "2026-02-01" }] } },
      EntityCommonStockSharesOutstanding: { units: { shares: [{ end: "2025-12-31", val: 100, filed: "2026-02-01" }] } },
      EarningsPerShareDiluted: {
        units: {
          "USD/shares": [
            { fy: 2025, fp: "FY", end: "2025-12-31", val: 5, filed: "2026-02-01" },
            { fy: 2024, fp: "FY", end: "2024-12-31", val: 4, filed: "2025-02-01" },
          ],
        },
      },
      NetIncomeLoss: { units: { USD: [{ fy: 2025, fp: "FY", end: "2025-12-31", val: 80, filed: "2026-02-01" }] } },
      NetCashProvidedByUsedInOperatingActivities: { units: { USD: [{ fy: 2025, fp: "FY", end: "2025-12-31", val: 120, filed: "2026-02-01" }] } },
      NetCashProvidedByUsedInInvestingActivities: { units: { USD: [{ fy: 2025, fp: "FY", end: "2025-12-31", val: -30, filed: "2026-02-01" }] } },
    },
  },
};

describe("SEC Graham snapshot", () => {
  it("derives Graham ratios from SEC companyfacts", () => {
    const snapshot = buildSecGrahamSnapshot(companyFacts, 50);

    expect(snapshot.pe).toBeCloseTo(10);
    expect(snapshot.pb).toBeCloseTo(50 / 6);
    expect(snapshot.debtRatio).toBeCloseTo(400 / 600);
    expect(snapshot.currentRatio).toBeCloseTo(3);
    expect(snapshot.quickRatio).toBeCloseTo(2.5);
    expect(snapshot.fcf).toBe(90);
    expect(snapshot.epsAllPositive).toBe(true);
    expect(snapshot.epsGrowing).toBe(true);
    expect(hasMinimumGrahamSnapshot(snapshot)).toBe(true);
  });
});
