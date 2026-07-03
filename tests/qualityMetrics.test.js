import { describe, expect, it } from "vitest";
import { buildSecQualitySeries, buildYahooQualitySeries } from "../src/tools/watchlist/qualityMetrics.js";

describe("quality metrics annual series", () => {
  it("builds normalized Yahoo annual series with FX, share scale and real gaps", () => {
    const series = buildYahooQualitySeries({
      financialFx: { rate: 0.5 },
      annual: [
        {
          date: "2025-12-31",
          totalRevenue: 1000,
          grossProfit: 400,
          operatingIncome: 200,
          netIncome: 100,
          operatingCashFlow: 150,
          investingCashFlow: -50,
          dilutedEPS: 4,
          dilutedAverageShares: 20,
        },
        {
          date: "2024-12-31",
          dilutedEPS: 3,
        },
        {
          date: "2023-12-31",
          operatingRevenue: 900,
          grossProfit: 360,
          EBIT: 180,
          netIncomeCommonStockholders: 90,
          cashFlowFromContinuingOperatingActivities: 140,
          cashFlowFromContinuingInvestingActivities: -40,
          basicEPS: 2.5,
          ordinarySharesNumber: 22,
        },
      ],
    }, { shareScale: 2 });

    expect(series.revenue.map((entry) => [entry.fiscalYear, entry.value])).toEqual([
      [2025, 500],
      [2023, 450],
    ]);
    expect(series.eps.map((entry) => [entry.fiscalYear, entry.value])).toEqual([
      [2025, 4],
      [2024, 3],
      [2023, 2.5],
    ]);
    expect(series.fcf.map((entry) => [entry.fiscalYear, entry.value])).toEqual([
      [2025, 50],
      [2023, 50],
    ]);
    expect(series.sharesOutstanding.map((entry) => [entry.fiscalYear, entry.value])).toEqual([
      [2025, 20],
      [2023, 22],
    ]);
    expect(series.grossMargin.map((entry) => [entry.fiscalYear, entry.value])).toEqual([
      [2025, 0.4],
      [2023, 0.4],
    ]);
    expect(series.operatingMargin.map((entry) => [entry.fiscalYear, entry.value])).toEqual([
      [2025, 0.2],
      [2023, 0.2],
    ]);
    expect(series.netMargin.map((entry) => [entry.fiscalYear, entry.value])).toEqual([
      [2025, 0.1],
      [2023, 0.1],
    ]);
    expect(series.revenue.some((entry) => entry.fiscalYear === 2024)).toBe(false);
    expect(series.fcf[0].source).toBe("yahoo_fundamentals_time_series");
    expect(series.revenue[0].sourceField).toBe("totalRevenue");
  });

  it("builds normalized SEC annual series without inventing missing fiscal years", () => {
    const series = buildSecQualitySeries({
      facts: {
        "us-gaap": {
          RevenueFromContractWithCustomerExcludingAssessedTax: {
            units: {
              USD: [
                { fy: 2025, fp: "FY", end: "2025-12-31", val: 1000, filed: "2026-02-01" },
                { fy: 2023, fp: "FY", end: "2023-12-31", val: 800, filed: "2024-02-01" },
              ],
            },
          },
          GrossProfit: {
            units: {
              USD: [
                { fy: 2025, fp: "FY", end: "2025-12-31", val: 450, filed: "2026-02-01" },
                { fy: 2023, fp: "FY", end: "2023-12-31", val: 300, filed: "2024-02-01" },
              ],
            },
          },
          OperatingIncomeLoss: {
            units: {
              USD: [
                { fy: 2025, fp: "FY", end: "2025-12-31", val: 200, filed: "2026-02-01" },
                { fy: 2023, fp: "FY", end: "2023-12-31", val: 120, filed: "2024-02-01" },
              ],
            },
          },
          NetIncomeLoss: {
            units: {
              USD: [
                { fy: 2025, fp: "FY", end: "2025-12-31", val: 100, filed: "2026-02-01" },
                { fy: 2024, fp: "FY", end: "2024-12-31", val: 80, filed: "2025-02-01" },
                { fy: 2023, fp: "FY", end: "2023-12-31", val: 60, filed: "2024-02-01" },
              ],
            },
          },
          NetCashProvidedByUsedInOperatingActivities: {
            units: {
              USD: [
                { fy: 2025, fp: "FY", end: "2025-12-31", val: 150, filed: "2026-02-01" },
                { fy: 2023, fp: "FY", end: "2023-12-31", val: 100, filed: "2024-02-01" },
              ],
            },
          },
          NetCashProvidedByUsedInInvestingActivities: {
            units: {
              USD: [
                { fy: 2025, fp: "FY", end: "2025-12-31", val: -40, filed: "2026-02-01" },
                { fy: 2023, fp: "FY", end: "2023-12-31", val: -30, filed: "2024-02-01" },
              ],
            },
          },
          EarningsPerShareDiluted: {
            units: {
              "USD/shares": [
                { fy: 2025, fp: "FY", end: "2025-12-31", val: 5, filed: "2026-02-01" },
                { fy: 2024, fp: "FY", end: "2024-12-31", val: 4, filed: "2025-02-01" },
              ],
            },
          },
        },
        dei: {
          EntityCommonStockSharesOutstanding: {
            units: {
              shares: [
                { end: "2025-12-31", val: 100, filed: "2026-02-01" },
                { end: "2023-12-31", val: 90, filed: "2024-02-01" },
              ],
            },
          },
        },
      },
    });

    expect(series.revenue.map((entry) => [entry.fiscalYear, entry.value])).toEqual([
      [2025, 1000],
      [2023, 800],
    ]);
    expect(series.eps.map((entry) => [entry.fiscalYear, entry.value])).toEqual([
      [2025, 5],
      [2024, 4],
    ]);
    expect(series.fcf.map((entry) => [entry.fiscalYear, entry.value])).toEqual([
      [2025, 110],
      [2023, 70],
    ]);
    expect(series.sharesOutstanding.map((entry) => [entry.fiscalYear, entry.value])).toEqual([
      [2025, 100],
      [2023, 90],
    ]);
    expect(series.grossMargin.map((entry) => [entry.fiscalYear, entry.value])).toEqual([
      [2025, 0.45],
      [2023, 0.375],
    ]);
    expect(series.operatingMargin.map((entry) => [entry.fiscalYear, entry.value])).toEqual([
      [2025, 0.2],
      [2023, 0.15],
    ]);
    expect(series.netMargin.map((entry) => [entry.fiscalYear, entry.value])).toEqual([
      [2025, 0.1],
      [2023, 0.075],
    ]);
    expect(series.revenue.some((entry) => entry.fiscalYear === 2024)).toBe(false);
    expect(series.netMargin[0].source).toBe("sec_companyfacts");
    expect(series.fcf[0].sourceField).toBe("NetCashProvidedByUsedInOperatingActivities+NetCashProvidedByUsedInInvestingActivities");
  });
});
