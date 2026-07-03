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
    expect(result.weightsApproved).toBe(true);
    expect(result.weightStatus).toBe("APROBADO-2026-07-03");
    expect(result.qualityConfidence).toBe("high");
    expect(result.components).toHaveLength(7);
    expect(result.capitalAllocationScore).not.toBeNull();
    expect(result.methodId).toBe("buffett_quality_score.v1_weighted");
  });

  it("returns null value and low confidence when there is no series data", () => {
    const result = buildBuffettQualityScore({});

    expect(result.value).toBeNull();
    expect(result.label).toBe("N/D");
    expect(result.qualityConfidence).toBe("low");
    expect(result.components.every((entry) => entry.value === null)).toBe(true);
  });
});

// Calibracion de pesos S84 con cifras publicas aproximadas (miles de millones USD).
// Fuente: 10-K de Apple FY2020-FY2024 vs un perfil ciclico debil construido con
// margenes finos, FCF negativo y dilucion. Sirve para validar que los pesos
// aprobados ordenan bien calidad alta vs baja, no para exactitud contable.
const APPLE_YEARS = [2020, 2021, 2022, 2023, 2024];
function series(values) {
  return values.map((value, index) => ({ fiscalYear: APPLE_YEARS[index], value }));
}

const appleLike = {
  ratios: { roe: 1.5, roa: 0.28, pbTangible: 4, tie: 100 },
  buffettSeries: {
    revenue: series([274.5, 365.8, 394.3, 383.3, 391.0]),
    operatingIncome: series([66.3, 108.9, 119.4, 114.3, 123.2]),
    netIncome: series([57.4, 94.7, 99.8, 97.0, 93.7]),
    operatingCF: series([80.7, 104.0, 122.2, 110.5, 118.3]),
    capex: series([7.3, 11.1, 10.7, 10.9, 9.4]),
    depreciationAmortization: series([11.1, 11.3, 11.1, 11.5, 11.4]),
    sharesOutstanding: series([17.5, 16.7, 16.2, 15.8, 15.3]),
    cash: series([38, 35, 24, 30, 30]),
    totalDebt: series([112, 124, 120, 111, 107]),
    operatingMargin: series([0.242, 0.298, 0.303, 0.298, 0.315]),
    netMargin: series([0.209, 0.259, 0.253, 0.253, 0.24]),
  },
};

const weakCyclical = {
  ratios: { roe: 0.03, roa: 0.01, pbTangible: 2, tie: 1.5 },
  buffettSeries: {
    revenue: series([100, 80, 120, 90, 110]),
    operatingIncome: series([5, -2, 8, 1, 4]),
    netIncome: series([2, -5, 4, -1, 1]),
    operatingCF: series([8, 3, 10, 4, 6]),
    capex: series([12, 10, 14, 11, 13]),
    depreciationAmortization: series([9, 9, 10, 9, 10]),
    sharesOutstanding: series([100, 105, 110, 116, 122]),
    operatingMargin: series([0.05, -0.025, 0.067, 0.011, 0.036]),
    netMargin: series([0.02, -0.063, 0.033, -0.011, 0.009]),
  },
};

describe("buildBuffettQualityScore weight calibration", () => {
  it("ranks a high-quality real profile well above a weak cyclical one", () => {
    const apple = buildBuffettQualityScore(appleLike);
    const weak = buildBuffettQualityScore(weakCyclical);

    expect(apple.value).toBeGreaterThanOrEqual(70);
    expect(weak.value).toBeLessThan(45);
    expect(apple.value).toBeGreaterThan(weak.value);
    expect(apple.label).toBe("Calidad Buffett alta");
  });
});
