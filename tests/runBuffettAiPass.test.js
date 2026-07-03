import { describe, expect, it, vi } from "vitest";
import { DRY_RUN_MODEL, runBuffettAiPass } from "../scripts/run-buffett-ai-pass.js";

function company(ticker) {
  return {
    ticker,
    buffett: {
      hardMetrics: { ownerEarnings: 500, netDebtToEbit: 1, shareCountCagr: -0.02, grossMarginTrend5y: "up" },
    },
  };
}

describe("runBuffettAiPass", () => {
  it("never calls a model in dry-run mode and emits insufficient_evidence", async () => {
    const runModel = vi.fn();
    const result = await runBuffettAiPass({
      companies: [company("AAA"), company("BBB")],
      runModel,
      now: () => "2026-07-03T00:00:00.000Z",
    });

    expect(runModel).not.toHaveBeenCalled();
    expect(result.mode).toBe("dry-run");
    expect(result.model).toBe(DRY_RUN_MODEL);
    expect(result.entries).toHaveLength(2);
    expect(result.entries.every((entry) => entry.status === "insufficient_evidence")).toBe(true);
    expect(result.entries[0].contradictions.requiresReview).toBe(false);
  });

  it("uses an injected model only in live mode and validates its output", async () => {
    const validExtraction = {
      ticker: "AAA",
      signals: Object.fromEntries(
        ["pricingPower", "customerConcentration", "capitalAllocationDiscipline", "cyclicality", "moatClues", "managementRedFlags", "guidanceTone", "financialStrength"]
          .map((signal) => [signal, { assessment: "unknown", confidence: 0 }]),
      ),
      facts: [],
      inferences: [],
      risks: [],
      sourceRefs: [],
      followUpQuestions: [],
    };
    const runModel = vi.fn().mockResolvedValue(validExtraction);
    const result = await runBuffettAiPass({ companies: [company("AAA")], mode: "live", runModel });

    expect(runModel).toHaveBeenCalledTimes(1);
    expect(result.mode).toBe("live");
    expect(result.entries[0].status).toBe("ok");
  });

  it("keeps insufficient_evidence when a live model returns invalid JSON", async () => {
    const runModel = vi.fn().mockResolvedValue({ garbage: true });
    const result = await runBuffettAiPass({ companies: [company("AAA")], mode: "live", runModel });

    expect(result.entries[0].status).toBe("insufficient_evidence");
    expect(result.entries[0].validation.valid).toBe(false);
  });
});
