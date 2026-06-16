import { describe, it, expect } from "vitest";
import { extractSicFromSubmissions, fetchSecSicCode, buildSecGrahamSnapshot } from "../src/tools/watchlist/secFundamentals.js";
import { detectSector } from "../src/tools/graham-analyzer/detectSector.js";

describe("extractSicFromSubmissions", () => {
  it("reads sicCode as a number", () => {
    expect(extractSicFromSubmissions({ sicCode: "6021" })).toBe(6021);
    expect(extractSicFromSubmissions({ sic: 4911 })).toBe(4911);
  });
  it("returns null when missing or invalid", () => {
    expect(extractSicFromSubmissions({})).toBeNull();
    expect(extractSicFromSubmissions({ sicCode: "n/a" })).toBeNull();
    expect(extractSicFromSubmissions(null)).toBeNull();
  });
});

describe("fetchSecSicCode", () => {
  it("fetches submissions and extracts the SIC", async () => {
    const fakeFetch = async () => ({ ok: true, json: async () => ({ sicCode: "2834" }) });
    expect(await fetchSecSicCode("0000000320", fakeFetch)).toBe(2834);
  });
});

describe("SEC snapshot carries sicCode for sector detection", () => {
  it("propagates sicCode into the snapshot", () => {
    const snap = buildSecGrahamSnapshot({ facts: {} }, 100, { sicCode: 6021 });
    expect(snap.sicCode).toBe(6021);
  });

  it("detectSector uses the snapshot SIC (bank) over absent text", () => {
    const snap = buildSecGrahamSnapshot({ facts: {} }, 100, { sicCode: 6021 });
    expect(detectSector({ sector: snap.sector, sicCode: snap.sicCode })).toBe("financial");
  });
});

describe("SEC snapshot tangible book", () => {
  // Equity 1000, Goodwill 300, Intangibles 200 → tangible equity 500 over 100
  // shares = tbvps 5; at price 50 → P/B tangible 10 (vs plain P/B 5 on bvps 10).
  const usd = (val) => ({ end: "2025-12-31", filed: "2026-02-01", fp: "FY", fy: 2025, val });
  const companyFacts = {
    facts: {
      "us-gaap": {
        StockholdersEquity: { units: { USD: [usd(1000)] } },
        Goodwill: { units: { USD: [usd(300)] } },
        IntangibleAssetsNetExcludingGoodwill: { units: { USD: [usd(200)] } },
      },
      dei: {
        EntityCommonStockSharesOutstanding: { units: { shares: [usd(100)] } },
      },
    },
  };

  it("computes pbTangible from equity minus goodwill and intangibles", () => {
    const snap = buildSecGrahamSnapshot(companyFacts, 50);
    expect(snap.tangibleBvps).toBeCloseTo(5, 5);
    expect(snap.pbTangible).toBeCloseTo(10, 5);
  });

  it("treats missing goodwill/intangibles as zero (tangible = book)", () => {
    const noIntangibles = { facts: { "us-gaap": { StockholdersEquity: { units: { USD: [usd(1000)] } } }, dei: { EntityCommonStockSharesOutstanding: { units: { shares: [usd(100)] } } } } };
    const snap = buildSecGrahamSnapshot(noIntangibles, 50);
    expect(snap.tangibleBvps).toBeCloseTo(snap.bvps, 5);
  });
});
