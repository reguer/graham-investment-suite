import { describe, expect, it } from "vitest";
import { buildCapitalAllocationMetrics, buildOwnerEarnings } from "../src/tools/watchlist/buffettValuation.js";

describe("buildCapitalAllocationMetrics", () => {
  it("builds numeric capital allocation metrics without converting them into a score", () => {
    const item = {
      tie: 8,
      buffettSeries: {
        revenue: [{ fiscalYear: 2025, value: 900 }],
        operatingIncome: [{ fiscalYear: 2025, value: 150 }],
        operatingCF: [{ fiscalYear: 2025, value: 120 }],
        capex: [{ fiscalYear: 2025, value: 70 }],
        depreciationAmortization: [{ fiscalYear: 2025, value: 60 }],
        sharesOutstanding: [
          { fiscalYear: 2025, value: 90 },
          { fiscalYear: 2023, value: 100 },
        ],
        cash: [{ fiscalYear: 2025, value: 30 }],
        totalDebt: [{ fiscalYear: 2025, value: 80 }],
      },
    };
    const ownerEarningsResult = buildOwnerEarnings(item);
    const result = buildCapitalAllocationMetrics(item, { ownerEarningsResult });

    expect(result.methodId).toBe("capital_allocation.v1");
    expect(result.confidence).toBe("high");
    expect(result.shareCountCagr).toBeLessThan(0);
    expect(result.buybackDirection).toBe("recompra_neta");
    expect(result.netDebt).toBe(50);
    expect(result.netDebtToOperatingIncome).toBeCloseTo(1 / 3);
    expect(result.interestCoverage).toBe(8);
    expect(result.reinvestmentRate).toBeCloseTo(70 / 120);
    expect(result.growthCapexProxy).toBe(10);
    expect(result.growthCapexToCapex).toBeCloseTo(10 / 70);
    expect(result.ownerEarningsCoverage).toBeCloseTo(60 / 120);
    expect(result.reason).toContain("sin convertirlo todavia en score");
  });

  it("leaves nulls plus explicit reasons when capital allocation inputs are incomplete", () => {
    const result = buildCapitalAllocationMetrics({
      buffettSeries: {
        sharesOutstanding: [{ fiscalYear: 2025, value: 90 }],
      },
    });

    expect(result.shareCountCagr).toBeNull();
    expect(result.netDebt).toBeNull();
    expect(result.interestCoverage).toBeNull();
    expect(result.reinvestmentRate).toBeNull();
    expect(result.ownerEarningsCoverage).toBeNull();
    expect(result.confidence).toBe("low");
    expect(result.reasons.shareCountCagr).toContain("dos anos");
    expect(result.reasons.netDebt).toContain("cash");
    expect(result.reasons.ownerEarningsCoverage).toContain("owner earnings");
  });
});
