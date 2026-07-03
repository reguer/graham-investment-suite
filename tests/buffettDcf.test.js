import { describe, expect, it } from "vitest";
import { buildBuffettDcf } from "../src/tools/watchlist/buffettValuation.js";

function flatCompany(overrides = {}) {
  const years = [2021, 2022, 2023, 2024, 2025];
  return {
    price: 10,
    buffettSeries: {
      revenue: years.map((fiscalYear) => ({ fiscalYear, value: 1000 })),
      operatingCF: years.map((fiscalYear) => ({ fiscalYear, value: 200, asOf: `${fiscalYear}-12-31` })),
      capex: years.map((fiscalYear) => ({ fiscalYear, value: 100 })),
      depreciationAmortization: years.map((fiscalYear) => ({ fiscalYear, value: 80 })),
      sharesOutstanding: years.map((fiscalYear) => ({ fiscalYear, value: 100 })),
    },
    ...overrides,
  };
}

describe("buildBuffettDcf", () => {
  it("values a flat-growth company with equal scenarios and default placeholder parameters", () => {
    const result = buildBuffettDcf(flatCompany());

    expect(result.valuationStatus).toBe("ok");
    expect(result.requiredReturn).toBe(0.1);
    expect(result.terminalGrowth).toBe(0.025);
    expect(result.forecastYears).toBe(10);
    expect(result.decisionStatus).toBe("APROBADO-2026-07-03");
    // ownerEarnings = 200 - min(capex 100, D&A 80) = 120; flat growth => bear = base = bull.
    expect(result.intrinsicValueBase).toBeCloseTo(1369.6, 0);
    expect(result.intrinsicValueBear).toBeCloseTo(result.intrinsicValueBase, 6);
    expect(result.intrinsicValueBull).toBeCloseTo(result.intrinsicValueBase, 6);
    expect(result.intrinsicValuePerShareBase).toBeCloseTo(13.7, 1);
    expect(result.mosBuffett).toBeCloseTo(0.27, 2);
  });

  it("never lets a scenario grow below base and keeps bull >= base >= bear", () => {
    const result = buildBuffettDcf({
      price: 10,
      buffettSeries: {
        revenue: [2021, 2022, 2023, 2024, 2025].map((fiscalYear, index) => ({ fiscalYear, value: 800 + index * 80 })),
        operatingCF: [2021, 2022, 2023, 2024, 2025].map((fiscalYear, index) => ({ fiscalYear, value: 120 + index * 20, asOf: `${fiscalYear}-12-31` })),
        capex: [2021, 2022, 2023, 2024, 2025].map((fiscalYear) => ({ fiscalYear, value: 60 })),
        depreciationAmortization: [2021, 2022, 2023, 2024, 2025].map((fiscalYear) => ({ fiscalYear, value: 70 })),
        sharesOutstanding: [2021, 2022, 2023, 2024, 2025].map((fiscalYear) => ({ fiscalYear, value: 100 })),
      },
    });

    expect(result.valuationStatus).toBe("ok");
    expect(result.growthAssumptions.bull).toBeGreaterThanOrEqual(result.growthAssumptions.base);
    expect(result.growthAssumptions.base).toBeGreaterThanOrEqual(result.growthAssumptions.bear);
    expect(result.intrinsicValueBull).toBeGreaterThanOrEqual(result.intrinsicValueBase);
    expect(result.intrinsicValueBase).toBeGreaterThanOrEqual(result.intrinsicValueBear);
  });

  it("does not emit a DCF when there are fewer than five clean years", () => {
    const result = buildBuffettDcf({
      buffettSeries: {
        operatingCF: [2024, 2025].map((fiscalYear) => ({ fiscalYear, value: 200 })),
        capex: [2024, 2025].map((fiscalYear) => ({ fiscalYear, value: 100 })),
        depreciationAmortization: [2024, 2025].map((fiscalYear) => ({ fiscalYear, value: 80 })),
      },
    });

    expect(result.valuationStatus).toBe("insufficient_history");
    expect(result.intrinsicValueBase).toBeNull();
  });

  it("clamps terminalGrowth below requiredReturn when an invalid override is passed", () => {
    const result = buildBuffettDcf(flatCompany(), { requiredReturn: 0.1, terminalGrowth: 0.2 });

    expect(result.terminalGrowth).toBeCloseTo(0.095, 6);
    expect(result.valuationStatus).toBe("ok");
  });
});
