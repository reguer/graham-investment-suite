import { describe, expect, it } from "vitest";
import { bmvSicUniverse, requestedTickers, tickerUniverse, universeMeta } from "../src/tools/watchlist/universe.js";

describe("ticker universe", () => {
  it("includes at least 200 Yahoo-validated BMV SIC equities", () => {
    expect(bmvSicUniverse.length).toBeGreaterThanOrEqual(200);
    expect(universeMeta.bmvSicCount).toBe(bmvSicUniverse.length);
    expect(bmvSicUniverse.every((item) => item.yahooSymbol.endsWith(".MX"))).toBe(true);
    expect(bmvSicUniverse.every((item) => item.market === "BMV SIC")).toBe(true);
  });

  it("includes the complete user requested batch", () => {
    const requested = new Set(requestedTickers.map((item) => item.rawTicker));
    for (const ticker of ["Index100", "SP500", "MU", "MRVL", "SNDK", "NVDA", "INTC", "SKHYNIX", "BB", "MSTR", "BAIDU", "TSLA", "AMD", "GOLD", "SILVER", "COPPER", "META"]) {
      expect(requested.has(ticker)).toBe(true);
    }
  });

  it("keeps validated aliases for requested symbols that differ from their raw input", () => {
    const byRaw = new Map(requestedTickers.map((item) => [item.rawTicker, item]));
    expect(byRaw.get("MRVL").yahooSymbol).toBe("MRVL1.MX");
    expect(byRaw.get("SNDK").yahooSymbol).toBe("SNDK1.MX");
    expect(byRaw.get("BAIDU").yahooSymbol).toBe("BIDUN.MX");
    expect(byRaw.get("Index100").yahooSymbol).toBe("^NDX");
    expect(byRaw.get("SP500").yahooSymbol).toBe("^GSPC");
  });

  it("deduplicates requested tickers against the BMV SIC base universe", () => {
    const keys = tickerUniverse.map((item) => item.ticker);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
