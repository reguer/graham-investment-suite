import { describe, expect, it } from "vitest";
import { fetchHistoricalPrices, fetchStooqHistoricalPrices, fetchYahooHistoricalPrices, parseStooqHistoricalCsv, parseYahooHistoricalChart } from "../src/tools/watchlist/priceSources.js";
import { parseHistoricalArgs, serializeHistoricalCsv } from "../scripts/download-historical-prices.js";

const csv = `Date,Open,High,Low,Close,Volume
2024-01-02,10,11,9,10.5,1000
2024-01-03,10.5,12,10,11.5,1500
`;

describe("historical Stooq prices", () => {
  it("parses historical OHLCV csv", () => {
    const rows = parseStooqHistoricalCsv(csv, "KBH");

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ ticker: "KBH", date: "2024-01-02", close: 10.5, source: "Stooq" });
  });

  it("fetches historical prices using compact dates", async () => {
    const urls = [];
    const rows = await fetchStooqHistoricalPrices("KBH", {
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      fetchImpl: async (url) => {
        urls.push(url);
        return { ok: true, text: async () => csv };
      },
    });

    expect(urls[0]).toContain("s=kbh.us");
    expect(urls[0]).toContain("d1=20240101");
    expect(urls[0]).toContain("d2=20240131");
    expect(rows[1].close).toBe(11.5);
  });

  it("parses download script args and serializes csv", () => {
    const args = parseHistoricalArgs(["node", "download-historical-prices.js", "--tickers", "kbh,mth", "--start", "2020-01-01", "--end", "2024-12-31"]);

    expect(args.tickers).toEqual(["KBH", "MTH"]);
    expect(serializeHistoricalCsv(parseStooqHistoricalCsv(csv, "KBH"))).toContain("Date,Open,High,Low,Close,Volume");
  });

  it("parses Yahoo historical chart payload", () => {
    const rows = parseYahooHistoricalChart({
      chart: {
        result: [{
          timestamp: [1704153600],
          indicators: { quote: [{ open: [10], high: [12], low: [9], close: [11], volume: [100] }] },
        }],
      },
    }, "KBH");

    expect(rows[0]).toMatchObject({ ticker: "KBH", close: 11, source: "Yahoo Finance Chart" });
  });

  it("falls back to Yahoo when Stooq returns no rows", async () => {
    const rows = await fetchHistoricalPrices("KBH", {
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      fetchImpl: async (url) => {
        if (String(url).includes("stooq.com")) return { ok: true, text: async () => "<html>challenge</html>" };
        return {
          ok: true,
          json: async () => ({
            chart: {
              result: [{
                timestamp: [1704153600],
                indicators: { quote: [{ open: [10], high: [12], low: [9], close: [11], volume: [100] }] },
              }],
            },
          }),
        };
      },
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].source).toBe("Yahoo Finance Chart");
  });

  it("fetches Yahoo historical prices with unix periods", async () => {
    const urls = [];
    await fetchYahooHistoricalPrices("KBH", {
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      fetchImpl: async (url) => {
        urls.push(url);
        return {
          ok: true,
          json: async () => ({ chart: { result: [{ timestamp: [], indicators: { quote: [{}] } }] } }),
        };
      },
    });

    expect(urls[0]).toContain("period1=");
    expect(urls[0]).toContain("period2=");
    expect(urls[0]).toContain("interval=1d");
  });
});
