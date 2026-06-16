import { describe, expect, it } from "vitest";
import { liquidityLabel, formatShort } from "../src/lib/liquidity.js";

describe("liquidityLabel", () => {
  it("flags high liquidity for heavy dollar volume", () => {
    // 10M shares * $200 = $2B/day → high
    const r = liquidityLabel({ avgVolume: 10_000_000, price: 200 });
    expect(r.level).toBe("high");
    expect(r.label).toMatch(/alta/i);
  });

  it("flags medium for mid dollar volume", () => {
    // 200k shares * $50 = $10M/day → medium
    expect(liquidityLabel({ avgVolume: 200_000, price: 50 }).level).toBe("medium");
  });

  it("flags low when exit can be slow", () => {
    // 50k shares * $40 = $2M/day → low
    expect(liquidityLabel({ avgVolume: 50_000, price: 40 }).level).toBe("low");
  });

  it("flags very_low for thin trading", () => {
    // 5k shares * $20 = $100k/day → very_low
    expect(liquidityLabel({ avgVolume: 5_000, price: 20 }).level).toBe("very_low");
  });

  it("falls back to market cap when volume is missing", () => {
    expect(liquidityLabel({ marketCap: 50_000_000_000 }).level).toBe("high");
    expect(liquidityLabel({ marketCap: 500_000_000 }).level).toBe("low");
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
