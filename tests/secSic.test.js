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
