import { describe, expect, it } from "vitest";
import { evaluateCandidate, screenWatchlist } from "../src/tools/watchlist/screen.js";

const candidate = {
  ticker: "TEST",
  companyName: "Test Co",
  sector: "Industrial",
  price: 100,
  pe: 10,
  pb: 1,
  pePb: 10,
  debtRatio: 0.4,
  currentRatio: 3,
  quickRatio: 1.2,
  fcf: 100,
  epsAllPositive: true,
  watchReason: "Fixture",
};

describe("watchlist screening", () => {
  it("approves a company that stays inside Graham limits", () => {
    const result = evaluateCandidate(candidate, { price: 100, source: "test" });
    expect(result.alertLevel).toBe("approved");
    expect(result.classification.id).toBe("graham_approved");
    expect(result.ratios.pe).toBeCloseTo(10);
    expect(result.ratios.pb).toBeCloseTo(1);
  });

  it("downgrades when price pushes valuation outside Graham limits", () => {
    const result = evaluateCandidate(candidate, { price: 180, source: "test" });
    expect(result.classification.id).not.toBe("graham_approved");
    expect(result.ratios.pePb).toBeCloseTo(32.4);
  });

  it("sorts approved names before weaker alerts", () => {
    const expensive = { ...candidate, ticker: "HIGH" };
    const results = screenWatchlist([expensive, candidate], {
      HIGH: { price: 180, source: "test" },
      TEST: { price: 100, source: "test" },
    });
    expect(results[0].ticker).toBe("TEST");
  });

  it("keeps pending companies visible without inventing Graham ratios", () => {
    const result = evaluateCandidate({
      ticker: "PENDING",
      yahooSymbol: "PENDING.MX",
      companyName: "Pending Co",
      sector: "Technology",
      analysisStatus: "pending_fundamentals",
      watchReason: "Missing fundamentals",
    }, { price: 25, source: "test" });

    expect(result.alertLevel).toBe("pending");
    expect(result.ratios).toBeNull();
    expect(result.livePrice).toBe(25);
    expect(result.classification.id).toBe("pending_fundamentals");
  });
});
