import { describe, expect, it } from "vitest";
import { buildPrompt } from "../src/tools/graham-analyzer/prompts.js";

const baseRatios = {
  price: 100,
  pe: 12,
  pb: 1.5,
  pePb: 18,
  pePbTangible: null,
  currentRatio: 2.5,
  quickRatio: 1.2,
  debtRatio: 0.4,
  tie: null,
  roe: null,
  roa: null,
  fcf: 500,
  ncav: null,
  grahamFormula: 90,
  grahamFormulaTangible: null,
  mosGraham: -0.1,
  epsAdj: 8.33,
  epsAllPositive: true,
  epsGrowing: true,
};

const baseClassification = {
  id: "graham_approved",
  label: "APROBADA",
  reason: "Pasa todos los criterios Graham defensivos.",
};

describe("buildPrompt", () => {
  it("omits null ratio fields from the prompt", () => {
    const prompt = buildPrompt({ ticker: "TEST", companyName: "Test Co", date: "2026-06-11" }, baseRatios, baseClassification);
    expect(prompt).not.toContain("pePbTangible");
    expect(prompt).not.toContain("TIE");
    expect(prompt).not.toContain("ROE");
    expect(prompt).not.toContain("ROA");
    expect(prompt).not.toContain("NCAV");
  });

  it("does not include the string 'null' anywhere in the prompt", () => {
    const ratiosWithNulls = { ...baseRatios, tie: null, roe: null, ncav: null };
    const prompt = buildPrompt({ ticker: "TEST", companyName: "Test Co", date: "2026-06-11" }, ratiosWithNulls, baseClassification);
    expect(prompt).not.toContain(": null");
    expect(prompt).not.toContain("null");
  });

  it("replaces blank/null company text fields with N/D", () => {
    const prompt = buildPrompt({ ticker: null, companyName: undefined, date: "" }, baseRatios, baseClassification);
    expect(prompt).toContain("N/D - N/D");
    expect(prompt).toContain("Fecha: N/D");
  });

  it("replaces 'null' string company fields with N/D", () => {
    const prompt = buildPrompt({ ticker: "null", companyName: "null", date: "null" }, baseRatios, baseClassification);
    expect(prompt).toContain("N/D - N/D");
    expect(prompt).toContain("Fecha: N/D");
  });

  it("includes present ratio fields correctly", () => {
    const prompt = buildPrompt({ ticker: "KBH", companyName: "KB Home", date: "2026-06-11" }, baseRatios, baseClassification);
    expect(prompt).toContain("P/E:");
    expect(prompt).toContain("P/B:");
    expect(prompt).toContain("Current Ratio:");
    expect(prompt).toContain("EPS historico positivo: si");
  });

  it("handles Infinity TIE without outputting 'Infinity' as a value", () => {
    const ratiosWithInfinityTie = { ...baseRatios, tie: Infinity };
    const prompt = buildPrompt({ ticker: "TEST", companyName: "Test Co", date: "2026-06-11" }, ratiosWithInfinityTie, baseClassification);
    expect(prompt).toContain("TIE: Infinity");
  });

  it("handles negative EPS (null pe) without outputting numeric null", () => {
    const ratiosNegEps = { ...baseRatios, pe: null, epsAdj: -2 };
    const prompt = buildPrompt({ ticker: "TEST", companyName: "Test Co", date: "2026-06-11" }, ratiosNegEps, baseClassification);
    expect(prompt).toContain("N/A por EPS negativo");
    expect(prompt).not.toContain(": null");
  });
});
