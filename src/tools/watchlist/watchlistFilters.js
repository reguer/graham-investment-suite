function normalizedNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function qualityScoreBand(item) {
  const value = normalizedNumber(item?.score?.qualityScore?.value);
  if (value === null) return "unknown";
  if (value >= 70) return "strong";
  if (value >= 45) return "medium";
  return "weak";
}

export function moatState(item) {
  return item?.moatSummary?.status === "manual_evidence" ? "manual_evidence" : "pending_manual";
}

export function moatConfidence(item) {
  return item?.moatSummary?.confidence || null;
}

export function matchesV2Filters(item, {
  selectedQualityBand = "",
  selectedMoatState = "",
  selectedMoatConfidence = "",
} = {}) {
  if (selectedQualityBand && qualityScoreBand(item) !== selectedQualityBand) return false;
  if (selectedMoatState && moatState(item) !== selectedMoatState) return false;
  if (selectedMoatConfidence && moatConfidence(item) !== selectedMoatConfidence) return false;
  return true;
}
