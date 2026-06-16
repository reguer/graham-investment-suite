import { describe, it, expect } from "vitest";
import { calcRatios } from "../src/tools/graham-analyzer/calcRatios.js";

// V = EPS * (8.5 + 2g), g as integer percent, capped to [0, 15].
function form(overrides = {}) {
  return {
    price: "100",
    epsTTM: "5",
    sharesOutstanding: "1000",
    equity: "50000",
    eps1: "5", eps2: "4.5", eps3: "4", eps4: "3.6", eps5: "3.2",
    ...overrides,
  };
}

describe("grahamGrowthValue", () => {
  it("computes V = EPS x (8.5 + 2g) with capped CAGR", () => {
    const r = calcRatios(form());
    // CAGR from 3.2 -> 5 over 4 spans = (5/3.2)^(1/4)-1 ≈ 0.1180 -> 11.80%
    // V = 5 * (8.5 + 2*11.80) = 5 * 32.10 = 160.5
    expect(r.grahamGrowthValue).toBeCloseTo(160.5, 1);
  });

  it("caps g at 15% so explosive growth doesn't inflate value", () => {
    // 1 -> 10 over 4 spans is ~77% CAGR; capped to 15.
    const r = calcRatios(form({ eps1: "10", eps2: "5", eps3: "3", eps4: "2", eps5: "1" }));
    // V = epsAdj * (8.5 + 2*15). epsAdj = epsTTM = 5 -> 5 * 38.5 = 192.5
    expect(r.grahamGrowthValue).toBeCloseTo(192.5, 1);
  });

  it("floors g at 0 for declining EPS (no negative growth premium)", () => {
    const r = calcRatios(form({ eps1: "3", eps2: "3.5", eps3: "4", eps4: "4.5", eps5: "5" }));
    // declining -> g floored to 0 -> V = 5 * 8.5 = 42.5
    expect(r.grahamGrowthValue).toBeCloseTo(42.5, 1);
  });

  it("returns null when EPS is missing or non-positive", () => {
    expect(calcRatios(form({ epsTTM: "" })).grahamGrowthValue).toBeNull();
    expect(calcRatios(form({ epsTTM: "-2" })).grahamGrowthValue).toBeNull();
  });

  it("exposes a margin of safety vs current price", () => {
    const r = calcRatios(form());
    // V≈160.5, price 100 -> MoS ≈ 0.605
    expect(r.mosGrowth).toBeCloseTo(0.605, 2);
  });
});
