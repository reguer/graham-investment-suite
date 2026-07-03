import { describe, expect, it } from "vitest";
import { matchesV2Filters, moatConfidence, moatState, qualityScoreBand } from "../src/tools/watchlist/watchlistFilters.js";

describe("watchlist V2 filters", () => {
  const manualEvidence = {
    score: { qualityScore: { value: 78 } },
    moatSummary: { status: "manual_evidence", confidence: "high" },
  };
  const pendingManual = {
    score: { qualityScore: { value: 52 } },
    moatSummary: { status: "pending_manual", confidence: null },
  };
  const weakQuality = {
    score: { qualityScore: { value: 30 } },
    moatSummary: { status: "manual_evidence", confidence: "low" },
  };

  it("classifies quality score into strong, medium and weak bands", () => {
    expect(qualityScoreBand(manualEvidence)).toBe("strong");
    expect(qualityScoreBand(pendingManual)).toBe("medium");
    expect(qualityScoreBand(weakQuality)).toBe("weak");
    expect(qualityScoreBand({ score: { qualityScore: { value: null } } })).toBe("unknown");
  });

  it("reads moat state and confidence from the manual summary", () => {
    expect(moatState(manualEvidence)).toBe("manual_evidence");
    expect(moatState({})).toBe("pending_manual");
    expect(moatConfidence(manualEvidence)).toBe("high");
    expect(moatConfidence(pendingManual)).toBeNull();
  });

  it("matches combined V2 filters without affecting unrelated items", () => {
    expect(matchesV2Filters(manualEvidence, { selectedQualityBand: "strong", selectedMoatState: "manual_evidence", selectedMoatConfidence: "high" })).toBe(true);
    expect(matchesV2Filters(pendingManual, { selectedMoatState: "manual_evidence" })).toBe(false);
    expect(matchesV2Filters(weakQuality, { selectedQualityBand: "weak", selectedMoatConfidence: "low" })).toBe(true);
    expect(matchesV2Filters(weakQuality, { selectedQualityBand: "medium" })).toBe(false);
  });
});
