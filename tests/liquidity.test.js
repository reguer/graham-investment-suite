import { describe, expect, it } from "vitest";
import { liquidityLabel, formatShort } from "../src/lib/liquidity.js";

describe("liquidityLabel", () => {
  it("uses market cap as the primary signal (large cap = high)", () => {
    const r = liquidityLabel({ marketCap: 50_000_000_000 });
    expect(r.level).toBe("high");
    expect(r.label).toMatch(/alta/i);
  });

  it("classifies mid and small caps", () => {
    expect(liquidityLabel({ marketCap: 5_000_000_000 }).level).toBe("medium");
    expect(liquidityLabel({ marketCap: 500_000_000 }).level).toBe("low");
  });

  it("dollar volume can RAISE but not lower a large cap (noisy Yahoo volume)", () => {
    // Large cap but a corrupt tiny avgVolume must NOT drag it to very_low.
    expect(liquidityLabel({ marketCap: 50_000_000_000, avgVolume: 100, price: 200 }).level).toBe("high");
    // A small cap that trades heavily IS liquid → raised to high.
    expect(liquidityLabel({ marketCap: 500_000_000, avgVolume: 10_000_000, price: 200 }).level).toBe("high");
  });

  it("uses dollar volume alone when market cap is missing", () => {
    expect(liquidityLabel({ avgVolume: 10_000_000, price: 200 }).level).toBe("high");
    expect(liquidityLabel({ avgVolume: 5_000, price: 20 }).level).toBe("very_low");
  });

  it("returns unknown when nothing is available", () => {
    expect(liquidityLabel({}).level).toBe("unknown");
    expect(liquidityLabel({ avgVolume: 1000 }).level).toBe("unknown"); // no price, no cap
  });
});

describe("formatShort", () => {
  it("formats with T/B/M/K suffixes", () => {
    expect(formatShort(2_300_000_000_000)).toBe("2.3T");
    expect(formatShort(1_200_000_000)).toBe("1.2B");
    expect(formatShort(45_000_000)).toBe("45.0M");
    expect(formatShort(7_500)).toBe("7.5K");
    expect(formatShort(123)).toBe("123");
  });
});
