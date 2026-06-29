import { describe, expect, it } from "vitest";
import { scoreWatchlistItem } from "../src/tools/watchlist/scoring.js";

describe("watchlist scoring", () => {
  it("rewards valuation, balance sheet resilience, cash flow and EPS consistency", () => {
    const score = scoreWatchlistItem({
      ticker: "SOFT",
      analysisStatus: "analyzed",
      alertLevel: "approved",
      pe: 14,
      pb: 1.4,
      pePb: 19.6,
      debtRatio: 0.4,
      currentRatio: 3,
      quickRatio: 1.5,
      fcf: 1000,
      epsAllPositive: true,
      epsHistory: [
        { year: 2025, eps: 5 },
        { year: 2024, eps: 4 },
        { year: 2023, eps: 3 },
      ],
      roe: 0.25,
      roa: 0.12,
    });

    expect(score.total).toBeGreaterThanOrEqual(85);
    expect(score.epsNeverDeclined).toBe(true);
    expect(score.qualityLayer.label).toBe("Alta calidad");
    expect(score.hasBuybackData).toBe(false);
  });

  it("penalizes expensive companies with weak EPS history even when they have liquidity", () => {
    const score = scoreWatchlistItem({
      ticker: "GROWTH",
      analysisStatus: "analyzed",
      alertLevel: "watch",
      pe: 90,
      pb: 12,
      pePb: 1080,
      debtRatio: 0.3,
      currentRatio: 2.5,
      quickRatio: 2,
      fcf: 1000,
      epsAllPositive: false,
      epsHistory: [
        { year: 2025, eps: 2 },
        { year: 2024, eps: -1 },
        { year: 2023, eps: 1 },
      ],
      roe: 0.2,
      roa: 0.1,
    });

    expect(score.total).toBeLessThan(60);
    expect(score.epsNeverDeclined).toBe(false);
    expect(score.qualityLayer.label).toBe("Calidad baja");
  });
});
