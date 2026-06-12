import { describe, it, expect } from "vitest";
import { provenance, buildProvenance, freshness, SOURCES } from "../src/lib/dataProvenance.js";

describe("provenance entries", () => {
  it("wraps value/source/asOf", () => {
    expect(provenance(12.5, SOURCES.YAHOO, "2026-06-11")).toEqual({
      value: 12.5,
      source: "Yahoo Finance",
      asOf: "2026-06-11",
    });
  });

  it("builds a per-field map from a snapshot", () => {
    const map = buildProvenance({ pe: 10, pb: 1.5 }, SOURCES.SEC, "2026-01-01");
    expect(map.pe).toEqual({ value: 10, source: "SEC EDGAR", asOf: "2026-01-01" });
    expect(map.pb.source).toBe("SEC EDGAR");
  });
});

describe("freshness", () => {
  const today = new Date("2026-06-11");

  it("classifies recent data as fresh", () => {
    expect(freshness("2026-06-01", { today }).level).toBe("fresh");
  });

  it("classifies month-plus data as aging", () => {
    expect(freshness("2026-05-01", { today }).level).toBe("aging");
  });

  it("classifies quarter-plus data as stale", () => {
    expect(freshness("2026-01-01", { today }).level).toBe("stale");
  });

  it("returns unknown for missing/invalid dates", () => {
    expect(freshness(null, { today }).level).toBe("unknown");
    expect(freshness("not-a-date", { today }).level).toBe("unknown");
  });
});
