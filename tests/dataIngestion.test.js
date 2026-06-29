import { describe, expect, it } from "vitest";
import { buildSymbolCandidates, parseArgs } from "../scripts/data-ingestion.js";
import { buildYahooDeepSnapshot, buildYahooSupplementalSnapshot } from "../src/tools/watchlist/yahooFundamentals.js";

const yahooFixture = {
  price: { currency: "USD", regularMarketPrice: 100 },
  summaryDetail: { trailingPE: 10 },
  defaultKeyStatistics: { priceToBook: 1.5, trailingEps: 10, bookValue: 66.67 },
  financialData: {
    financialCurrency: "USD",
    currentRatio: 2.5,
    quickRatio: 1.2,
    debtToEquity: 25,
    freeCashflow: 1000,
    returnOnEquity: 0.2,
    returnOnAssets: 0.1,
  },
};

describe("Yahoo supplemental ingestion", () => {
  it("parses unsupported and ticker modes", () => {
    expect(parseArgs(["node", "script", "--all-unsupported", "--limit", "5"]).limit).toBe(5);
    expect(parseArgs(["node", "script", "--ticker", "mu"]).ticker).toBe("MU");
  });

  it("tries the BMV/SIC Yahoo symbol first and then the base ticker", () => {
    expect(buildSymbolCandidates({ yahooSymbol: "ETN.MX" }, "ETN")).toEqual(["ETN.MX", "ETN"]);
    expect(buildSymbolCandidates({ yahooSymbol: "BIDU" }, "BIDU")).toEqual(["BIDU"]);
  });

  it("builds a USD partial snapshot without pretending EPS history is complete", () => {
    const result = buildYahooSupplementalSnapshot(yahooFixture, { symbol: "MU" });

    expect(result.ok).toBe(true);
    expect(result.snapshot.pe).toBe(10);
    expect(result.snapshot.pb).toBe(1.5);
    expect(result.snapshot.pePb).toBe(15);
    expect(result.snapshot.debtRatio).toBe(0.25);
    expect(result.snapshot.epsAllPositive).toBeNull();
    expect(result.warnings.join(" ")).toContain("historial EPS completo");
  });

  it("rejects non-USD fundamentals before calculating ratios", () => {
    const result = buildYahooSupplementalSnapshot({
      ...yahooFixture,
      financialData: { ...yahooFixture.financialData, financialCurrency: "CNY" },
    }, { symbol: "BIDU" });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain("CNY");
  });

  it("does not accept incomplete Yahoo ratios as a minimum snapshot", () => {
    const result = buildYahooSupplementalSnapshot({
      ...yahooFixture,
      defaultKeyStatistics: { trailingEps: 10 },
    }, { symbol: "ABBV" });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain("ratios minimos");
  });

  it("builds a converted deep Yahoo snapshot with inferred share scale", () => {
    const result = buildYahooDeepSnapshot({
      symbol: "BIDU",
      expectedCurrency: "USD",
      priceCurrency: "USD",
      financialCurrency: "CNY",
      priceFx: { ok: true, rate: 1, source: "same-currency" },
      financialFx: { ok: true, rate: 0.15, source: "Yahoo Finance CNYUSD=X" },
      summary: {
        price: { currency: "USD", regularMarketPrice: 120 },
        summaryDetail: { trailingPE: 12 },
        defaultKeyStatistics: { priceToBook: 1.5 },
        financialData: { financialCurrency: "CNY" },
      },
      quarterly: [
        {
          date: "2026-03-31",
          totalAssets: 1100,
          currentAssets: 650,
          inventory: 50,
          totalLiabilitiesNetMinorityInterest: 450,
          currentLiabilities: 250,
          stockholdersEquity: 650,
          dilutedAverageShares: 10,
          totalRevenue: 210,
          EBIT: 35,
          interestExpense: 3,
          netIncome: 25,
          operatingCashFlow: 38,
          investingCashFlow: -12,
          dilutedEPS: 1.4,
        },
        {
          date: "2025-12-31",
          totalRevenue: 205,
          EBIT: 32,
          interestExpense: 2,
          netIncome: 24,
          operatingCashFlow: 35,
          investingCashFlow: -11,
          dilutedEPS: 1.3,
        },
        {
          date: "2025-09-30",
          totalRevenue: 198,
          EBIT: 29,
          interestExpense: 2,
          netIncome: 23,
          operatingCashFlow: 34,
          investingCashFlow: -9,
          dilutedEPS: 1.2,
        },
        {
          date: "2025-06-30",
          totalRevenue: 192,
          EBIT: 24,
          interestExpense: 2,
          netIncome: 20,
          operatingCashFlow: 33,
          investingCashFlow: -8,
          dilutedEPS: 1.1,
        },
      ],
      annual: [
        {
          date: "2025-12-31",
          totalAssets: 1000,
          currentAssets: 600,
          inventory: 50,
          totalLiabilitiesNetMinorityInterest: 400,
          currentLiabilities: 200,
          stockholdersEquity: 600,
          dilutedAverageShares: 10,
          totalRevenue: 800,
          EBIT: 120,
          interestExpense: 10,
          netIncome: 100,
          operatingCashFlow: 140,
          investingCashFlow: -40,
          dilutedEPS: 5,
        },
        { date: "2024-12-31", dilutedEPS: 4 },
      ],
    });

    expect(result.ok).toBe(true);
    expect(result.snapshot.pe).toBeCloseTo(12);
    expect(result.snapshot.pb).toBeCloseTo(1.5);
    expect(result.snapshot.currentRatio).toBeCloseTo(2.6);
    expect(result.snapshot.sourceDate).toBe("2026-03-31");
    expect(result.snapshot.sourcePeriod).toBe("quarterly");
    expect(result.snapshot.fcf).toBeCloseTo((38 - 12 + 35 - 11 + 34 - 9 + 33 - 8) * 0.15);
    expect(result.snapshot.epsHistory).toHaveLength(2);
    expect(result.warnings.join(" ")).toContain("Fundamentales convertidos");
  });
});
