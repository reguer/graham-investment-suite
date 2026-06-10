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

  it("nulls pb and grahamFormula when equity is negative", () => {
    const ratios = calcRatios({ ...tsm, equity: "-1000000" });

    expect(ratios.pb).toBeNull();
    expect(ratios.pePb).toBeNull();
    expect(ratios.grahamFormula).toBeNull();
    expect(ratios.hasNegativeEquity).toBe(true);
  });

  it("uses real year span for CAGR when year labels are provided", () => {
    const sparse = {
      ...tsm,
      eps1: "20",
      epsYear1: "2025",
      eps2: "10",
      epsYear2: "2021",
      eps3: "",
      epsYear3: "",
      eps4: "",
      epsYear4: "",
    };
    const ratios = calcRatios(sparse);
    // yearSpan = 2025 - 2021 = 4; CAGR = (20/10)^(1/4) - 1 ≈ 0.1892
    expect(ratios.epsCagr).toBeCloseTo(Math.pow(2, 0.25) - 1, 4);
  });

  it("falls back to entry-count denominator for CAGR when years are missing", () => {
    const noYears = {
      ...tsm,
      eps1: "20",
      epsYear1: "",
      eps2: "10",
      epsYear2: "",
      eps3: "",
      epsYear3: "",
      eps4: "",
      epsYear4: "",
    };
    const ratios = calcRatios(noYears);
    // yearSpan = length - 1 = 1; CAGR = (20/10)^(1/1) - 1 = 1.0
    expect(ratios.epsCagr).toBeCloseTo(1.0, 4);
  });

  it("calculates quick ratio without inventing inventory when inventory is empty", () => {
    const ratios = calcRatios({ ...tsm, inventory: "" });

    expect(ratios.quickRatio).toBeCloseTo(ratios.currentRatio, 6);
  });

  it("nulls EPS-dependent ratios when EPS is zero", () => {
    const ratios = calcRatios({ ...tsm, epsTTM: "0" });

    expect(ratios.epsAdj).toBe(0);
    expect(ratios.pe).toBeNull();
    expect(ratios.pricePE15).toBeNull();
    expect(ratios.grahamFormula).toBeNull();
    expect(ratios.grahamFormulaTangible).toBeNull();
  });

  it("returns null CAGR and null epsGrowing when only one EPS value exists", () => {
    const ratios = calcRatios({
      ...tsm,
      eps1: "5.00",
      epsYear1: "2025",
      eps2: "",
      epsYear2: "",
      eps3: "",
      epsYear3: "",
      eps4: "",
      epsYear4: "",
    });

    expect(ratios.epsHistory).toHaveLength(1);
    expect(ratios.epsCagr).toBeNull();
    // null = trend unknown (not enough data), consistent with secFundamentals.js
    expect(ratios.epsGrowing).toBeNull();
  });
});
