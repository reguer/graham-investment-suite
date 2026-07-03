import { describe, expect, it } from "vitest";
import { checkBuffettContradictions } from "../src/tools/watchlist/buffettValidator.js";
import { emptyBuffettExtraction } from "../src/tools/watchlist/buffettPrompts.js";

function extractionWith(overrides = {}) {
  const extraction = emptyBuffettExtraction("TEST");
  for (const [signal, assessment] of Object.entries(overrides)) {
    extraction.signals[signal] = { assessment, confidence: 0.9 };
  }
  return extraction;
}

describe("checkBuffettContradictions", () => {
  it("flags no contradiction when narrative matches metrics", () => {
    const result = checkBuffettContradictions({
      extraction: extractionWith({ financialStrength: "strong" }),
      metrics: { netDebtToEbit: 1, ownerEarnings: 500, grossMarginTrend5y: "up", shareCountCagr: -0.03 },
    });

    expect(result.contradictionCount).toBe(0);
    expect(result.requiresReview).toBe(false);
    expect(result.blocksBuffettLabel).toBe(false);
  });

  it("flags a high contradiction and blocks the label when balance claim conflicts with leverage", () => {
    const result = checkBuffettContradictions({
      extraction: extractionWith({ financialStrength: "strong" }),
      metrics: { netDebtToEbit: 5 },
    });

    expect(result.severityMax).toBe("high");
    expect(result.blocksBuffettLabel).toBe(true);
    expect(result.requiresReview).toBe(true);
    expect(result.confidencePenalty).toBeGreaterThan(0);
  });

  it("flags a medium contradiction when pricing power claim conflicts with falling margins", () => {
    const result = checkBuffettContradictions({
      extraction: extractionWith({ pricingPower: "strong" }),
      metrics: { grossMarginTrend5y: "down" },
    });

    expect(result.severityMax).toBe("medium");
    expect(result.blocksBuffettLabel).toBe(false);
    expect(result.requiresReview).toBe(true);
  });

  it("flags dilution disguised as disciplined buybacks", () => {
    const result = checkBuffettContradictions({
      extraction: extractionWith({ capitalAllocationDiscipline: "strong" }),
      metrics: { shareCountCagr: 0.05 },
    });

    expect(result.contradictionCount).toBe(1);
    expect(result.severityMax).toBe("high");
  });
});
