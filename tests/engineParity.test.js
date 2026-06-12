import { describe, it, expect } from "vitest";
import { calcRatios } from "../src/tools/graham-analyzer/calcRatios.js";
import { deriveSnapshot } from "../src/tools/watchlist/screen.js";

// EPIC U — the manual analyzer (calcRatios, from a balance-sheet form) and the
// watchlist screen (deriveSnapshot, from a pre-computed candidate) are two paths
// to the same ratios. These tests pin the contract that, fed equivalent inputs,
// they agree on pe/pb/pePb — so a future refactor can collapse them safely.

describe("engine parity: calcRatios vs deriveSnapshot", () => {
  // A clean company: price 100, EPS 8, BVPS 50 -> pe 12.5, pb 2, pePb 25.
  const form = {
    price: "100",
    epsTTM: "8",
    equity: "5000000",
    sharesOutstanding: "100000",
    currentAssets: "3000000",
    currentLiabilities: "1000000",
    totalLiabilities: "2500000",
    inventory: "500000",
    operatingCF: "900000",
    investingCF: "-200000",
  };

  it("calcRatios produces the expected base ratios", () => {
    const r = calcRatios(form);
    expect(r.pe).toBeCloseTo(12.5, 4);
    expect(r.pb).toBeCloseTo(2, 4);
    expect(r.pePb).toBeCloseTo(25, 4);
  });

  it("deriveSnapshot reproduces pe/pb/pePb from the candidate at unchanged price", () => {
    const manual = calcRatios(form);
    // Build the watchlist candidate from the same numbers.
    const candidate = {
      sector: "Industrial",
      price: manual.price,
      pe: manual.pe,
      pb: manual.pb,
      debtRatio: manual.debtRatio,
      currentRatio: manual.currentRatio,
      quickRatio: manual.quickRatio,
      fcf: manual.fcf,
      epsAllPositive: true,
    };
    const derived = deriveSnapshot(candidate, candidate.price);
    expect(derived.pe).toBeCloseTo(manual.pe, 6);
    expect(derived.pb).toBeCloseTo(manual.pb, 6);
    expect(derived.pePb).toBeCloseTo(manual.pePb, 6);
  });

  it("deriveSnapshot rescales pe/pb linearly when price moves", () => {
    const candidate = { sector: "Industrial", price: 100, pe: 12.5, pb: 2, debtRatio: 0.5, currentRatio: 3, fcf: 1 };
    const derived = deriveSnapshot(candidate, 120); // +20% price
    expect(derived.pe).toBeCloseTo(15, 6); // 12.5 * 1.2
    expect(derived.pb).toBeCloseTo(2.4, 6); // 2 * 1.2
  });
});
