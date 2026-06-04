import { grahamCandidates } from "../graham-analyzer/candidates.js";
import { tickerUniverse, universeMeta } from "./universe.js";

export const DEFAULT_ALERT_POLICY = {
  nearPePb: 28,
  nearPe: 22,
  nearPb: 2.3,
  nearDebtRatio: 1.2,
  nearCurrentRatio: 1.8,
  grahamDistancePct: 0.15,
};

export const analyzedWatchlist = grahamCandidates.map((candidate) => ({
  ...candidate,
  analysisStatus: "analyzed",
  yahooSymbol: candidate.yahooSymbol || candidate.ticker,
  market: candidate.market || "US",
  watchReason: candidate.note,
  tags: candidate.sector === "Residential Construction" ? ["graham-approved", "homebuilder", "cyclical"] : ["graham-approved"],
}));

const analyzedByTicker = new Map(analyzedWatchlist.map((candidate) => [candidate.ticker.toUpperCase(), candidate]));

const universeWatchlist = tickerUniverse.map((item) => {
  const analyzed = analyzedByTicker.get(item.ticker.toUpperCase());
  if (analyzed) {
    return {
      ...item,
      ...analyzed,
      yahooSymbol: analyzed.yahooSymbol || analyzed.ticker,
      market: analyzed.market || "US",
      validationStatus: item.validationStatus || "manual_snapshot",
    };
  }

  return {
    ...item,
    analysisStatus: "pending_fundamentals",
    watchReason: "Pendiente de primer analisis Graham: requiere fundamentales de Yahoo Finance o captura manual validada.",
    tags: [item.priority === "requested" ? "requested" : "bmv-sic", "pending-analysis"],
  };
});

const universeTickerKeys = new Set(tickerUniverse.map((item) => item.ticker.toUpperCase()));
const analyzedOutsideUniverse = analyzedWatchlist.filter((item) => !universeTickerKeys.has(item.ticker.toUpperCase()));

export const watchlist = [...universeWatchlist, ...analyzedOutsideUniverse];

export const watchlistMeta = {
  ...universeMeta,
  analyzedCount: analyzedWatchlist.length,
  pendingCount: watchlist.filter((item) => item.analysisStatus !== "analyzed").length,
};
