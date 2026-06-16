import { describe, expect, it } from "vitest";
import { failingCriteria, actionableReason } from "../src/tools/graham-analyzer/failingCriteria.js";
import { getSectorProfile } from "../src/tools/graham-analyzer/sectorProfiles.js";

const industrial = getSectorProfile("industrial");
const financial = getSectorProfile("financial");
const tech = getSectorProfile("tech");

describe("failingCriteria", () => {
  it("lists each failing criterion with value and threshold", () => {
    const ratios = { pe: 30, pb: 3.1, pePb: 93, debtRatio: 1.4, currentRatio: 1.1, epsAllPositive: true };
    const fails = failingCriteria(ratios, industrial);
    expect(fails).toContain("P/E 30.00 > 20.00");
    expect(fails).toContain("P/B 3.10 > 2.00");
    expect(fails).toContain("Deuda 1.40 >= 1.00");
    expect(fails).toContain("Corriente 1.10 < 2.00");
  });

  it("returns no failures for a clean industrial company", () => {
    const ratios = { pe: 12, pb: 1.2, pePb: 14, debtRatio: 0.5, currentRatio: 2.4, epsAllPositive: true };
    expect(failingCriteria(ratios, industrial)).toEqual([]);
  });

  it("omits sector-irrelevant criteria (a bank is not failed on debt/current)", () => {
    const bank = { pe: 12, pb: 1.5, pePb: 18, debtRatio: 3.4, currentRatio: null, epsAllPositive: true };
    const fails = failingCriteria(bank, financial);
    expect(fails.some((f) => f.startsWith("Deuda"))).toBe(false);
    expect(fails.some((f) => f.startsWith("Corriente"))).toBe(false);
    expect(fails).toEqual([]);
  });

  it("uses tangible book for intangible-heavy sectors and flags missing data as N/D", () => {
    const techCo = { pe: 18, pb: 2.0, pbTangible: undefined, pePbTangible: undefined, debtRatio: 0.5, currentRatio: 2, epsAllPositive: true };
    const fails = failingCriteria(techCo, tech);
    expect(fails).toContain("P/B tang. N/D");
  });

  it("flags non-positive EPS and negative equity", () => {
    const ratios = { pe: 10, pb: 1, pePb: 10, debtRatio: 0.3, currentRatio: 3, epsAllPositive: false, hasNegativeEquity: true };
    const fails = failingCriteria(ratios, industrial);
    expect(fails).toContain("EPS no siempre positivo");
    expect(fails).toContain("Patrimonio negativo");
  });
});

describe("actionableReason", () => {
  it("prefixes the failing list with 'Falla:'", () => {
    const ratios = { pe: 30, pb: 1, pePb: 30, debtRatio: 0.3, currentRatio: 3, epsAllPositive: true };
    expect(actionableReason(ratios, industrial)).toBe("Falla: P/E 30.00 > 20.00 · P/E×P/B 30.00 > 22.50");
  });

  it("returns a positive note when nothing fails", () => {
    const ratios = { pe: 12, pb: 1.2, pePb: 14, debtRatio: 0.5, currentRatio: 2.4, epsAllPositive: true };
    expect(actionableReason(ratios, industrial)).toMatch(/Cumple/);
  });
});
