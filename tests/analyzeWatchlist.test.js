import { describe, expect, it } from "vitest";
import { existingSnapshotResult, hasExistingGrahamSnapshot } from "../scripts/analyze-watchlist.js";

const manualSnapshot = {
  ticker: "MANUAL",
  companyName: "Manual Snapshot Co",
  price: 100,
  pe: 10,
  pb: 1,
  debtRatio: 0.4,
  currentRatio: 3,
  quickRatio: 1.5,
  fcf: 100,
  epsAllPositive: true,
  source: "Manual",
  sourceDate: "2026-06-08",
  watchReason: "Snapshot manual completo.",
};

describe("watchlist full analysis preservation", () => {
  it("detects complete existing Graham snapshots", () => {
    expect(hasExistingGrahamSnapshot(manualSnapshot)).toBe(true);
    expect(hasExistingGrahamSnapshot({ ...manualSnapshot, pb: null })).toBe(false);
  });

  it("preserves complete manual snapshots when automatic SEC analysis is incomplete", () => {
    const result = existingSnapshotResult(manualSnapshot, "SEC incompleto.");

    expect(result.status).toBe("analyzed");
    expect(result.publicRecord.analysisStatus).toBe("analyzed");
    expect(result.publicRecord.validationStatus).toBe("manual_snapshot");
    expect(result.snapshot.pePb).toBe(10);
    expect(result.classification.id).toBe("graham_approved");
    expect(result.publicRecord.autoAnalysisNote).toBe("SEC incompleto.");
  });
});
