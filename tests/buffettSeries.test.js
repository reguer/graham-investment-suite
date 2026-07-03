import { describe, expect, it } from "vitest";
import { buildBuffettSeries, buildSecBuffettSeries, buildYahooBuffettSeries } from "../src/tools/watchlist/buffettSeries.js";

describe("buffett series builders", () => {
  it("builds Yahoo Buffett series with annual gaps preserved and source metadata", () => {
    const series = buildYahooBuffettSeries({
      financialFx: { rate: 0.5 },
      annual: [
        {
          date: "2025-12-31",
          totalRevenue: 1000,
          grossProfit: 450,
          operatingIncome: 200,
          netIncome: 100,
          operatingCashFlow: 160,
          capitalExpenditure: -30,
          depreciationAndAmortization: 25,
          dilutedAverageShares: 20,
          cashAndCashEquivalents: 220,
          totalDebt: 300,
        },
        {
          date: "2023-12-31",
          totalRevenue: 800,
          grossProfit: 320,
          EBIT: 120,
          netIncomeCommonStockholders: 60,
          cashFlowFromContinuingOperatingActivities: 100,
          capitalExpenditures: -20,
          depreciationAmortization: 18,
          ordinarySharesNumber: 22,
          cashCashEquivalentsAndShortTermInvestments: 180,
          currentDebt: 40,
        },
      ],
    });

    expect(series.revenue.map((entry) => [entry.fiscalYear, entry.value, entry.currency])).toEqual([
      [2025, 500, "USD"],
      [2023, 400, "USD"],
    ]);
    expect(series.capex.map((entry) => [entry.fiscalYear, entry.value])).toEqual([
      [2025, 15],
      [2023, 10],
    ]);
    expect(series.operatingIncome[0].sourceForm).toBe("annual");
    expect(series.cash[0].sourceField).toBe("cashAndCashEquivalents");
    expect(series.totalDebt.map((entry) => [entry.fiscalYear, entry.value])).toEqual([
      [2025, 150],
      [2023, 20],
    ]);
    expect(series.grossMargin.map((entry) => [entry.fiscalYear, entry.value])).toEqual([
      [2025, 0.45],
      [2023, 0.4],
    ]);
  });

  it("builds SEC Buffett series with sourceForm and debt fallback logic", () => {
    const series = buildSecBuffettSeries({
      facts: {
        "us-gaap": {
          RevenueFromContractWithCustomerExcludingAssessedTax: {
            units: {
              USD: [
                { fy: 2025, fp: "FY", form: "10-K", end: "2025-12-31", val: 1000, filed: "2026-02-01" },
                { fy: 2023, fp: "FY", form: "10-K", end: "2023-12-31", val: 800, filed: "2024-02-01" },
              ],
            },
          },
          GrossProfit: {
            units: {
              USD: [
                { fy: 2025, fp: "FY", form: "10-K", end: "2025-12-31", val: 450, filed: "2026-02-01" },
                { fy: 2023, fp: "FY", form: "10-K", end: "2023-12-31", val: 320, filed: "2024-02-01" },
              ],
            },
          },
          OperatingIncomeLoss: {
            units: {
              USD: [
                { fy: 2025, fp: "FY", form: "10-K", end: "2025-12-31", val: 200, filed: "2026-02-01" },
                { fy: 2023, fp: "FY", form: "10-K", end: "2023-12-31", val: 120, filed: "2024-02-01" },
              ],
            },
          },
          NetIncomeLoss: {
            units: {
              USD: [
                { fy: 2025, fp: "FY", form: "10-K", end: "2025-12-31", val: 100, filed: "2026-02-01" },
                { fy: 2023, fp: "FY", form: "10-K", end: "2023-12-31", val: 60, filed: "2024-02-01" },
              ],
            },
          },
          NetCashProvidedByUsedInOperatingActivities: {
            units: {
              USD: [
                { fy: 2025, fp: "FY", form: "10-K", end: "2025-12-31", val: 160, filed: "2026-02-01" },
                { fy: 2023, fp: "FY", form: "10-K", end: "2023-12-31", val: 100, filed: "2024-02-01" },
              ],
            },
          },
          PaymentsToAcquirePropertyPlantAndEquipment: {
            units: {
              USD: [
                { fy: 2025, fp: "FY", form: "10-K", end: "2025-12-31", val: -30, filed: "2026-02-01" },
              ],
            },
          },
          DepreciationDepletionAndAmortization: {
            units: {
              USD: [
                { fy: 2025, fp: "FY", form: "10-K", end: "2025-12-31", val: 25, filed: "2026-02-01" },
              ],
            },
          },
          CashAndCashEquivalentsAtCarryingValue: {
            units: {
              USD: [
                { fy: 2025, fp: "FY", form: "10-K", end: "2025-12-31", val: 220, filed: "2026-02-01" },
              ],
            },
          },
          LongTermDebtNoncurrent: {
            units: {
              USD: [
                { fy: 2025, fp: "FY", form: "10-K", end: "2025-12-31", val: 250, filed: "2026-02-01" },
                { fy: 2023, fp: "FY", form: "10-K", end: "2023-12-31", val: 180, filed: "2024-02-01" },
              ],
            },
          },
          LongTermDebtCurrent: {
            units: {
              USD: [
                { fy: 2025, fp: "FY", form: "10-K", end: "2025-12-31", val: 50, filed: "2026-02-01" },
              ],
            },
          },
        },
        dei: {
          EntityCommonStockSharesOutstanding: {
            units: {
              shares: [
                { end: "2025-12-31", form: "10-K", val: 100, filed: "2026-02-01" },
                { end: "2023-12-31", form: "10-K", val: 90, filed: "2024-02-01" },
              ],
            },
          },
        },
      },
    });

    expect(series.operatingCF.map((entry) => [entry.fiscalYear, entry.value, entry.sourceForm])).toEqual([
      [2025, 160, "10-K"],
      [2023, 100, "10-K"],
    ]);
    expect(series.capex[0].value).toBe(30);
    expect(series.sharesOutstanding[0].currency).toBe("shares");
    expect(series.totalDebt.map((entry) => [entry.fiscalYear, entry.value])).toEqual([
      [2025, 300],
      [2023, 180],
    ]);
    expect(series.netMargin.map((entry) => [entry.fiscalYear, entry.value])).toEqual([
      [2025, 0.1],
      [2023, 0.075],
    ]);
  });

  it("merges SEC primary data with Yahoo fallback and reports missing years", () => {
    const series = buildBuffettSeries({
      companyFacts: {
        facts: {
          "us-gaap": {
            RevenueFromContractWithCustomerExcludingAssessedTax: {
              units: {
                USD: [
                  { fy: 2025, fp: "FY", form: "10-K", end: "2025-12-31", val: 1000, filed: "2026-02-01" },
                  { fy: 2023, fp: "FY", form: "10-K", end: "2023-12-31", val: 800, filed: "2024-02-01" },
                ],
              },
            },
          },
        },
      },
      yahooData: {
        annual: [
          { date: "2024-12-31", totalRevenue: 900, operatingCashFlow: 140, dilutedAverageShares: 95 },
          { date: "2022-12-31", totalRevenue: 700, operatingCashFlow: 120, dilutedAverageShares: 100 },
        ],
      },
    }, { maxYears: 10 });

    expect(series.revenue.map((entry) => [entry.fiscalYear, entry.value, entry.source])).toEqual([
      [2025, 1000, "sec_companyfacts"],
      [2024, 900, "yahoo_fundamentals_time_series"],
      [2023, 800, "sec_companyfacts"],
      [2022, 700, "yahoo_fundamentals_time_series"],
    ]);
    expect(series.operatingCF.map((entry) => [entry.fiscalYear, entry.value])).toEqual([
      [2024, 140],
      [2022, 120],
    ]);
    expect(series.missingYearsByMetric.revenue).toEqual([]);
    expect(series.missingYearsByMetric.operatingCF).toEqual([2023]);
  });
});
