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
    expect(result.classification.id).toBe("analysis_incomplete");
    expect(result.classification.label).toBe("DATOS INSUFICIENTES");
  });

  it("does not treat null ratios as numeric zero", () => {
    expect(evaluateCandidate({
      ...candidate,
      pb: null,
      pePb: null,
    }).alertLevel).toBe("pending");
  });

  it("keeps analyzed incomplete companies out of first-analysis pending", () => {
    const result = evaluateCandidate({
      ...candidate,
      analysisStatus: "analyzed",
      pb: null,
      pePb: null,
      classificationLabel: "RECHAZADA",
      notes: "Datos insuficientes para aprobar.",
    });

    expect(result.alertLevel).toBe("watch");
    expect(result.classification.id).toBe("rejected");
  });

  it("marks companies with fewer than three critical ratios as incomplete", () => {
    const result = evaluateCandidate({
      ticker: "EMPTY",
      companyName: "Empty Co",
      pe: null,
      pb: null,
      debtRatio: 0.4,
      currentRatio: null,
      fcf: null,
    });

    expect(result.analysisStatus).toBe("analysis_incomplete");
    expect(result.alertLabel).toBe("Datos insuficientes");
    expect(result.ratios).toBeNull();
  });

  it("keeps Yahoo model rejections out of the source capture queue", () => {
    const result = evaluateCandidate({
      ticker: "BANK",
      companyName: "Rejected Bank",
      validationStatus: "yahoo_model_rejected",
      pe: null,
      pb: null,
      debtRatio: 0.4,
      currentRatio: null,
      fcf: null,
      notes: "Rechazada por modelo Graham defensivo.",
    });

    expect(result.alertLevel).toBe("watch");
    expect(result.alertLabel).toBe("Rechazada por modelo");
    expect(result.ratios).toBeNull();
  });

  it("evaluates financial sector companies without currentRatio/debtRatio", () => {
    const bank = {
      ticker: "USB",
      companyName: "U.S. Bancorp",
      sector: "Financial Services",
      price: 55.52,
      pe: 12.05,
      pb: 1.48,
      pePb: 17.83,
      debtRatio: null,
      currentRatio: null,
      quickRatio: null,
      fcf: null,
      epsAllPositive: true,
    };
    const result = evaluateCandidate(bank, { price: 55.52, source: "test" });
    expect(result.ratios).not.toBeNull();
    expect(result.alertLevel).toBe("near");
    expect(result.ratios.pePb).toBeCloseTo(17.83, 1);
  });

  it("marks financial sector company as near even with high debtRatio structure", () => {
    const insurer = {
      ticker: "TRV",
      companyName: "The Travelers Companies",
      sector: "Financial Services",
      price: 299.6,
      pe: 8.58,
      pb: 1.99,
      pePb: 17.07,
      debtRatio: 3.37,
      currentRatio: null,
      quickRatio: null,
      fcf: null,
      epsAllPositive: true,
    };
    const result = evaluateCandidate(insurer, { price: 299.6, source: "test" });
    expect(result.alertLevel).toBe("near");
  });

  it("does not promote financial sector to near when pePb exceeds nearPePb", () => {
    const expensive = {
      ticker: "GS",
      companyName: "Goldman Sachs",
      sector: "Financial Services",
      price: 600,
      pe: 15,
      pb: 1.8,
      pePb: 27,
      debtRatio: null,
      currentRatio: null,
      fcf: 5000,
      epsAllPositive: true,
    };
    const result = evaluateCandidate(expensive, { price: 660, source: "test" });
    expect(result.alertLevel).toBe("watch");
  });

  it("classifies indexes and ETFs as market references", () => {
    const result = evaluateCandidate({
      ticker: "^GSPC",
      yahooSymbol: "^GSPC",
      companyName: "S&P 500",
      quoteType: "INDEX",
      analysisStatus: "index_reference",
      validationStatus: "index_reference",
      tags: ["index_reference"],
    }, { price: 5300, source: "test" });

    expect(result.alertLevel).toBe("reference");
    expect(result.ratios).toBeNull();
    expect(result.classification.id).toBe("index_reference");
  });

  it("uses lastPrice as live price while preserving the base financial snapshot", () => {
    const result = evaluateCandidate({ ...candidate, lastPrice: 180 });

    expect(result.livePrice).toBe(180);
    expect(result.ratios.pe).toBeCloseTo(18);
    expect(result.ratios.pb).toBeCloseTo(1.8);
    expect(result.ratios.pePb).toBeCloseTo(32.4);
  });
});
