import { describe, expect, it } from "vitest";
import { buildOwnerEarnings } from "../src/tools/watchlist/buffettValuation.js";

describe("buildOwnerEarnings", () => {
  it("builds owner earnings and derives yield from market cap when available", () => {
    const result = buildOwnerEarnings({
      marketCap: 1000,
      buffettSeries: {
        revenue: [{ fiscalYear: 2025, value: 1000 }],
        operatingCF: [{ fiscalYear: 2025, value: 120, asOf: "2025-12-31" }],
        capex: [{ fiscalYear: 2025, value: 70 }],
        depreciationAmortization: [{ fiscalYear: 2025, value: 60 }],
        sharesOutstanding: [{ fiscalYear: 2025, value: 100 }],
      },
    });

    expect(result.ownerEarnings).toBe(60);
    expect(result.ownerEarningsMargin).toBe(0.06);
    expect(result.ownerEarningsPerShare).toBe(0.6);
    expect(result.ownerEarningsYield).toBe(0.06);
    expect(result.maintenanceCapexMethodId).toBe("maintenance_capex.base_min_capex_da");
    expect(result.methodId).toBe("owner_earnings.operating_cf_minus_maintenance_capex");
    expect(result.confidence).toBe("medium");
  });

  it("returns owner earnings as null with a reason when maintenance capex cannot be estimated", () => {
    const result = buildOwnerEarnings({
      buffettSeries: {
        operatingCF: [{ fiscalYear: 2025, value: 120 }],
      },
    });

    expect(result.ownerEarnings).toBeNull();
    expect(result.methodId).toBe("owner_earnings.insufficient_maintenance_capex");
    expect(result.reason).toContain("maintenance");
  });

  it("derives per-share owner earnings with ADR ratio and leaves yield null when market cap is unavailable", () => {
    const result = buildOwnerEarnings({
      adrRatio: 5,
      price: null,
      buffettSeries: {
        revenue: [{ fiscalYear: 2025, value: 800 }],
        operatingCF: [{ fiscalYear: 2025, value: 150 }],
        capex: [{ fiscalYear: 2025, value: 40 }],
        depreciationAmortization: [{ fiscalYear: 2025, value: 60 }],
        sharesOutstanding: [{ fiscalYear: 2025, value: 100 }],
      },
    });

    expect(result.ownerEarnings).toBe(114);
    expect(result.ownerEarningsPerShare).toBeCloseTo(5.7);
    expect(result.ownerEarningsYield).toBeNull();
    expect(result.maintenanceCapexMethodId).toBe("maintenance_capex.asset_light_cap");
    expect(result.yieldReason).toContain("marketCap");
  });
});
