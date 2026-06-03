import { grahamCandidates } from "../graham-analyzer/candidates.js";

export const DEFAULT_ALERT_POLICY = {
  nearPePb: 28,
  nearPe: 22,
  nearPb: 2.3,
  nearDebtRatio: 1.2,
  nearCurrentRatio: 1.8,
  grahamDistancePct: 0.15,
};

export const watchlist = grahamCandidates.map((candidate) => ({
  ...candidate,
  watchReason: candidate.note,
  tags: candidate.sector === "Residential Construction" ? ["graham-approved", "homebuilder", "cyclical"] : ["graham-approved"],
}));
