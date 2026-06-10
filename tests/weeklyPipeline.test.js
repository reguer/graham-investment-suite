import { describe, expect, it } from "vitest";
import { buildPipelineSteps, parseArgs, runWeeklyPipeline } from "../scripts/weekly-pipeline.js";

describe("weekly pipeline", () => {
  it("builds the local data flow in order", () => {
    const steps = buildPipelineSteps({ limit: 40, noTelegram: true });
    expect(steps.map((step) => step.id)).toEqual([
      "universe-sync",
      "universe-refresh",
      "fundamentals-ingest",
      "weekly-screen",
    ]);
    expect(steps[2].args).toContain("40");
    expect(steps[3].args).toContain("--no-telegram");
  });

  it("supports dry-run without executing commands", () => {
    const result = runWeeklyPipeline(["node", "weekly-pipeline.js", "--dry-run", "--limit", "25"]);
    expect(result.dryRun).toBe(true);
    expect(result.steps).toHaveLength(4);
  });

  it("parses no-telegram and limit", () => {
    expect(parseArgs(["node", "weekly-pipeline.js", "--limit", "10", "--no-telegram"])).toEqual({
      limit: 10,
      noTelegram: true,
      dryRun: false,
    });
  });
});
