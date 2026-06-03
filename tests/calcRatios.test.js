import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { calcRatios } from "../src/tools/graham-analyzer/calcRatios.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const tsm = JSON.parse(readFileSync(join(__dirname, "fixtures", "tsm.json"), "utf8"));

describe("calcRatios", () => {
  it("calculates TSM with the documented ADR logic", () => {
    const ratios = calcRatios(tsm);

    expect(ratios.epsAdj).toBeCloseTo(52.75, 4);
    expect(ratios.bvps).toBeCloseTo(33.1243, 4);
    expect(ratios.pe).toBeCloseTo(7.0332, 4);
    expect(ratios.pb).toBeCloseTo(11.2002, 4);
    expect(ratios.pePb).toBeCloseTo(78.7732, 4);
    expect(ratios.currentRatio).toBeCloseTo(2.5073, 4);
    expect(ratios.quickRatio).toBeCloseTo(2.318, 3);
    expect(ratios.tie).toBeCloseTo(166.0437, 4);
    expect(ratios.roe).toBeCloseTo(0.3146, 4);
    expect(ratios.roa).toBeCloseTo(0.214, 3);
    expect(ratios.fcf).toBe(35994340);
    expect(ratios.ncav).toBeCloseTo(7.8603, 4);
    expect(ratios.mosGraham).toBeLessThan(0);
  });

  it("adjusts EPS and BVPS only when ADR ratio is enabled", () => {
    const base = { ...tsm, isADR: false, adrRatio: "5" };
    const adr = { ...tsm, isADR: true, adrRatio: "5" };

    expect(calcRatios(base).epsAdj).toBeCloseTo(10.55, 4);
    expect(calcRatios(base).bvps).toBeCloseTo(6.6249, 4);
    expect(calcRatios(adr).epsAdj).toBeCloseTo(52.75, 4);
    expect(calcRatios(adr).bvps).toBeCloseTo(33.1243, 4);
  });

  it("uses Net Tangible Assets override only when positive", () => {
    expect(calcRatios({ ...tsm, netTangibleAssets: "100000" }).tangibleEquity).toBe(100000);
    expect(calcRatios({ ...tsm, netTangibleAssets: "" }).tangibleEquity).toBe(164476536);
    expect(calcRatios({ ...tsm, netTangibleAssets: "0" }).tangibleEquity).toBe(164476536);
  });

  it("nulls valuation ratios that depend on positive EPS", () => {
    const ratios = calcRatios({ ...tsm, epsTTM: "-1.25", eps1: "-1" });

    expect(ratios.pe).toBeNull();
    expect(ratios.pricePE15).toBeNull();
    expect(ratios.grahamFormula).toBeNull();
    expect(ratios.grahamFormulaTangible).toBeNull();
    expect(ratios.epsAllPositive).toBe(false);
  });

  it("returns Infinity for TIE when there is no interest expense and EBIT is positive", () => {
    const ratios = calcRatios({ ...tsm, interestExpense: "0", ebit: "100" });
    expect(ratios.tie).toBe(Infinity);
  });

  it("calculates FCF as operating cash flow plus investing cash flow", () => {
    const ratios = calcRatios({ ...tsm, operatingCF: "1,000,000", investingCF: "-250,000" });
    expect(ratios.fcf).toBe(750000);
  });

  it("parses comma inputs and preserves negatives", () => {
    const ratios = calcRatios({
      ...tsm,
      ebit: "-1,000",
      interestExpense: "100",
      investingCF: "-1,000,000",
      eps1: "-1.25",
    });

    expect(ratios.tie).toBeCloseTo(-10, 4);
    expect(ratios.fcf).toBe(71428386);
    expect(ratios.epsAllPositive).toBe(false);
  });
});
