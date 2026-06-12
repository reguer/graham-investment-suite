import { describe, it, expect } from "vitest";
import { safeDiv, grahamNumber, maxDefensivePrice, marginOfSafety } from "../src/lib/grahamFormulas.js";

describe("safeDiv", () => {
  it("divides finite operands", () => {
    expect(safeDiv(10, 4)).toBe(2.5);
  });
  it("returns null on zero or null denominator/numerator", () => {
    expect(safeDiv(1, 0)).toBeNull();
    expect(safeDiv(null, 4)).toBeNull();
    expect(safeDiv(1, null)).toBeNull();
  });
});

describe("grahamNumber", () => {
  it("computes sqrt(22.5 * eps * bvps)", () => {
    expect(grahamNumber(5, 20)).toBeCloseTo(Math.sqrt(2250), 6); // 47.43
  });
  it("returns null when eps or bvps is non-positive or missing", () => {
    expect(grahamNumber(0, 20)).toBeNull();
    expect(grahamNumber(5, -1)).toBeNull();
    expect(grahamNumber(null, 20)).toBeNull();
  });
});

describe("maxDefensivePrice", () => {
  it("takes the lowest of graham number, P/E20 and P/B2 prices", () => {
    expect(maxDefensivePrice({ grahamFormula: 47, pricePe20: 100, pricePb2: 40 })).toBe(40);
  });
  it("falls back to the P/E20 price when book value is unavailable", () => {
    expect(maxDefensivePrice({ grahamFormula: null, pricePe20: 100, pricePb2: null })).toBe(100);
  });
});

describe("marginOfSafety", () => {
  it("computes (value - price) / price", () => {
    expect(marginOfSafety(120, 100)).toBeCloseTo(0.2, 6);
  });
  it("returns null when value missing or price is zero", () => {
    expect(marginOfSafety(null, 100)).toBeNull();
    expect(marginOfSafety(120, 0)).toBeNull();
  });
});
