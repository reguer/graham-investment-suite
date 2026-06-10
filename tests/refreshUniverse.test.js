import { describe, expect, it } from "vitest";
import { buildRefreshPayload, mergeQuotesIntoRecords, selectRefreshTargets } from "../scripts/refresh-universe.js";

const records = [
  { ticker: "AAPL", yahooSymbol: "AAPL", companyName: "Apple", analysisStatus: "analyzed", priority: "requested" },
  { ticker: "^GSPC", yahooSymbol: "^GSPC", companyName: "S&P 500", analysisStatus: "index_reference" },
  { ticker: "PENDING", yahooSymbol: "PENDING", companyName: "Pending", analysisStatus: "pending_fundamentals" },
];

describe("refresh universe prices", () => {
  it("selects requested or reference targets when asked", () => {
    expect(selectRefreshTargets(records, { requestedOnly: true }).map((item) => item.ticker)).toEqual(["AAPL"]);
    expect(selectRefreshTargets(records, { referencesOnly: true }).map((item) => item.ticker)).toEqual(["^GSPC"]);
  });

  it("stores live prices without overwriting the financial snapshot price", () => {
    const [record] = mergeQuotesIntoRecords(
      [{ ticker: "AAPL", price: 100, pe: 10, yahooSymbol: "AAPL" }],
      { AAPL: { ticker: "AAPL", price: 125, date: "2026-06-08", source: "test", currency: "USD" } },
      { date: new Date("2026-06-08T18:00:00Z") },
    );

    expect(record.price).toBe(100);
    expect(record.lastPrice).toBe(125);
    expect(record.lastPriceSource).toBe("test");
    expect(record.quoteCurrency).toBe("USD");
  });

  it("builds an auditable refresh payload", () => {
    const payload = buildRefreshPayload({
      records,
      targets: records,
      quotes: { AAPL: { ticker: "AAPL", price: 125 } },
      args: {},
      date: new Date("2026-06-08T18:00:00Z"),
    });

    expect(payload.generatedAt).toBe("2026-06-08T18:00:00.000Z");
    expect(payload.counts.resolved).toBe(1);
    expect(payload.counts.unresolved).toBe(2);
    expect(payload.unresolved.map((item) => item.ticker)).toEqual(["^GSPC", "PENDING"]);
  });
});
