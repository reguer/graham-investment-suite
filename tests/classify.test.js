import { describe, expect, it } from "vitest";
import { classify } from "../src/tools/graham-analyzer/classify.js";

const base = {
  pe: 12,
  pb: 1.2,
  pePb: 14.4,
  debtRatio: 0.5,
  currentRatio: 2.5,
  quickRatio: 1.5,
  tie: 20,
  roe: 0.25,
  roa: 0.1,
  fcf: 100,
  epsAllPositive: true,
  epsGrowing: true,
};

describe("classify", () => {
  it("approves a cheap and solid Graham company", () => {
    expect(classify(base).id).toBe("graham_approved");
  });

  it("classifies excellent but expensive companies", () => {
    const result = classify({ ...base, pe: 35, pb: 3, pePb: 105 });
    expect(result.id).toBe("excellent_expensive");
  });

  it("keeps strong but expensive companies as excellent even with imperfect EPS history", () => {
    const result = classify({ ...base, pe: 35, pb: 3, pePb: 105, epsGrowing: false, epsAllPositive: false });
    expect(result.id).toBe("excellent_expensive");
  });

  it("classifies valuation-only failures with weaker profitability as overvalued", () => {
    const result = classify({ ...base, pe: 35, pb: 3, pePb: 105, roe: 0.08, roa: 0.03, tie: 2.5 });
    expect(result.id).toBe("good_overvalued");
  });

  it("rejects companies with negative EPS or null P/E", () => {
    const result = classify({ ...base, pe: null, epsAllPositive: false });
    expect(result.id).toBe("rejected");
  });

  it("rejects incomplete valuation data", () => {
    const result = classify({ ...base, pb: null, pePb: null });
    expect(result.id).toBe("rejected");
  });

  it("allows P/E 20 and P/E x P/B 22.5 when everything else passes", () => {
    const result = classify({ ...base, pe: 20, pb: 1.125, pePb: 22.5 });
    expect(result.id).toBe("graham_approved");
  });

  it("does not approve P/E 20.01", () => {
    const result = classify({ ...base, pe: 20.01, pb: 1, pePb: 20.01 });
    expect(result.id).not.toBe("graham_approved");
  });
});
