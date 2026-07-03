import { describe, expect, it } from "vitest";
import {
  BUFFETT_SIGNALS,
  buildBuffettExtractionPrompt,
  emptyBuffettExtraction,
  validateBuffettExtraction,
} from "../src/tools/watchlist/buffettPrompts.js";

describe("buildBuffettExtractionPrompt", () => {
  it("forces JSON output, abstention and fact/inference/risk separation", () => {
    const { system, user, schema } = buildBuffettExtractionPrompt({
      ticker: "MSFT",
      metrics: { netDebtToEbit: 0.5 },
      filingExcerpts: ["Segmento cloud crecio 30%."],
      transcriptChunks: ["Esperamos margenes estables."],
    });

    expect(system).toContain("JSON");
    expect(system.toLowerCase()).toContain("unknown");
    expect(system).toContain("fact");
    expect(user).toContain("[F1]");
    expect(user).toContain("[T1]");
    expect(Object.keys(schema.signals)).toEqual(BUFFETT_SIGNALS);
  });
});

describe("validateBuffettExtraction", () => {
  it("accepts a well-formed extraction", () => {
    const extraction = emptyBuffettExtraction("MSFT");
    extraction.facts.push({ text: "Cloud crecio 30%", sourceRef: "s1" });
    extraction.sourceRefs.push({ id: "s1", sourceType: "10-K", period: "FY2025", locator: "MD&A" });

    const result = validateBuffettExtraction(extraction);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects invalid assessment, out-of-range confidence and facts without sourceRef", () => {
    const extraction = emptyBuffettExtraction("MSFT");
    extraction.signals.pricingPower = { assessment: "amazing", confidence: 2 };
    extraction.facts.push({ text: "sin fuente" });

    const result = validateBuffettExtraction(extraction);
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes("Assessment invalido"))).toBe(true);
    expect(result.errors.some((error) => error.includes("Confidence fuera de rango"))).toBe(true);
    expect(result.errors.some((error) => error.includes("sin sourceRef"))).toBe(true);
  });

  it("rejects a non-object payload", () => {
    expect(validateBuffettExtraction(null).valid).toBe(false);
    expect(validateBuffettExtraction([]).valid).toBe(false);
  });
});
