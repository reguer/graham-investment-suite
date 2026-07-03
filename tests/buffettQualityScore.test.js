import { describe, expect, it } from "vitest";
import { buildBuffettQualityScore } from "../src/tools/watchlist/buffettValuation.js";

function solidCompany() {
  const years = [2021, 2022, 2023, 2024, 2025];
  return {
    ratios: { roe: 0.2, roa: 0.1, pbTangible: 2, tie: 8 },
    buffettSeries: {
      revenue: years.map((fiscalYear, index) => ({ fiscalYear, value: 1000 + index * 50 })),
      operatingIncome: years.map((fiscalYear, index) => ({ fiscalYear, value: 250 + index * 10 })),
      netIncome: years.map((fiscalYear, index) => ({ fiscalYear, value: 180 + index * 8 })),
      operatingCF: years.map((fiscalYear, index) => ({ fiscalYear, value: 220 + index * 10, asOf: `${fiscalYear}-12-31` })),
      capex: years.map((fiscalYear) => ({ fiscalYear, value: 90 })),
      depreciationAmortization: years.map((fiscalYear) => ({ fiscalYear, value: 80 })),
      sharesOutstanding: years.map((fiscalYear, index) => ({ fiscalYear, value: 110 - index * 3 })),
      cash: years.map((fiscalYear) => ({ fiscalYear, value: 300 })),
      totalDebt: years.map((fiscalYear) => ({ fiscalYear, value: 150 })),
      operatingMargin: [0.24, 0.25, 0.26, 0.25, 0.27].map((value, index) => ({ fiscalYear: years[index], value })),
      netMargin: [0.17, 0.18, 0.18, 0.17, 0.19].map((value, index) => ({ fiscalYear: years[index], value })),
    },
  };
}

describe("buildBuffettQualityScore", () => {
  it("scores a solid company with high confidence and placeholder weights not approved", () => {
    const result = buildBuffettQualityScore(solidCompany());

    expect(typeof result.value).toBe("number");
    expect(result.value).toBeGreaterThan(50);
    expect(result.weightsApproved).toBe(false);
    expect(result.weightStatus).toBe("PENDIENTE-DECISION");
    expect(result.qualityConfidence).toBe("high");
    expect(result.components).toHaveLength(7);
    expect(result.capitalAllocationScore).not.toBeNull();
    expect(result.methodId).toBe("buffett_quality_score.v1_placeholder_weights");
  });

  it("returns null value and low confidence when there is no series data", () => {
    const result = buildBuffettQualityScore({});

    expect(result.value).toBeNull();
    expect(result.label).toBe("N/D");
    expect(result.qualityConfidence).toBe("low");
    expect(result.components.every((entry) => entry.value === null)).toBe(true);
  });
});
