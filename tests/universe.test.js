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
    for (const ticker of ["Index100", "SP500", "MU", "MRVL", "SNDK", "NVDA", "INTC", "SKHYNIX", "BB", "MSTR", "BIDU", "TSLA", "AMD", "GOLD", "SILVER", "COPPER", "META", "MOS", "BAER", "SHMD", "CBRS", "SPACEX", "TR", "SIVE", "IQE", "AAOI", "OPTX", "IREN", "BRUN", "CRWV", "HIVE", "CLSK", "ASYS", "ICHR", "INTT", "PENG", "AMPG", "SILC", "NOK", "XFAB", "MCHP", "MX", "AMBQ", "AKAM"]) {
      expect(requested.has(ticker)).toBe(true);
    }
    expect(requested.has("MVRL")).toBe(false);
  });

  it("keeps validated aliases for requested symbols that differ from their raw input", () => {
    const byRaw = new Map(requestedTickers.map((item) => [item.rawTicker, item]));
    expect(byRaw.get("MRVL").yahooSymbol).toBe("MRVL1.MX");
    expect(byRaw.get("SNDK").yahooSymbol).toBe("SNDK1.MX");
    expect(byRaw.get("BIDU").yahooSymbol).toBe("BIDU");
    expect(byRaw.get("Index100").yahooSymbol).toBe("^NDX");
    expect(byRaw.get("SP500").yahooSymbol).toBe("^GSPC");
  });

  it("deduplicates requested tickers against the BMV SIC base universe", () => {
    const keys = tickerUniverse.map((item) => item.ticker);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("excludes real estate, construction and armament-related companies", () => {
    const forbidden = /(real estate|reit|construction|homebuilding|homebuilder|engineering & construction|aerospace & defense|defense|weapons|armament|farm & heavy construction machinery|mortgage reit)/i;
    const matches = tickerUniverse.filter((item) => forbidden.test([item.sector, item.industry, item.companyName, item.notes, ...(item.tags || [])].filter(Boolean).join(" | ")));
    expect(matches).toEqual([]);
  });
});
