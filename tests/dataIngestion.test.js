import { describe, expect, it } from "vitest";
import { parseArgs } from "../scripts/data-ingestion.js";
import { buildYahooSupplementalSnapshot } from "../src/tools/watchlist/yahooFundamentals.js";

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
});
