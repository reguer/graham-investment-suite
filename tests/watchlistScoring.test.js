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
      pbTangible: 2.2,
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
      qualitySeries: {
        revenue: [
          { fiscalYear: 2025, value: 132 },
          { fiscalYear: 2023, value: 100 },
        ],
        grossMargin: [{ fiscalYear: 2025, value: 0.72 }],
        operatingMargin: [{ fiscalYear: 2025, value: 0.18 }],
        fcf: [{ fiscalYear: 2025, value: 28 }],
        sharesOutstanding: [
          { fiscalYear: 2025, value: 90 },
          { fiscalYear: 2023, value: 100 },
        ],
      },
      sector: "Technology",
      industry: "Software - Infrastructure",
      tangibleBvps: 8,
      roe: 0.25,
      roa: 0.12,
    });

    expect(score.total).toBeGreaterThanOrEqual(85);
    expect(score.epsNeverDeclined).toBe(true);
    expect(score.qualityLayer.label).toBe("Alta calidad");
    expect(score.hasBuybackData).toBe(true);
    expect(score.buybackDilution.label).toBe("Recompra neta");
    expect(score.intangibleBalance.label).toBe("Dependencia baja");
    expect(score.softwareQuality.label).toBe("Software fuerte");
    expect(score.grahamScore.value).toBe(score.valuation);
    expect(score.qualityScore.value).toBe(score.quality);
    expect(score.moatScore.value).toBeNull();
    expect(score.moatScore.label).toBe("N/D (captura pendiente)");
    expect(score.moatScore.captured).toBe(false);
    expect(score.generalScore.value).toBe(Math.round(0.55 * score.valuation + 0.45 * score.quality));
    expect(score.generalScore.weightsApproved).toBe(false);
    expect(score.generalScore.weightStatus).toBe("PENDIENTE-DECISION");
    expect(score.generalScore.usesLegacyRanking).toBe(false);
    expect(score.generalScore.moatWeightPending).toBe(true);
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

  it("surfaces captured manual moat in moatScore while keeping the numeric weight pending", () => {
    const score = scoreWatchlistItem({
      ticker: "MOAT",
      analysisStatus: "analyzed",
      alertLevel: "approved",
      pe: 14,
      pb: 1.4,
      pePb: 19.6,
      roe: 0.2,
      roa: 0.1,
      moatSummary: { hasData: true, label: "Wide moat", confidence: "high", filledFieldCount: 3, status: "manual_evidence" },
    });

    expect(score.moatScore.captured).toBe(true);
    expect(score.moatScore.label).toBe("Wide moat");
    expect(score.moatScore.confidence).toBe("high");
    expect(score.moatScore.value).toBeNull();
    expect(score.generalScore.moatWeightPending).toBe(true);
  });
});
