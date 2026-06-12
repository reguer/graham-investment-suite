// Data provenance: track where each financial figure came from and how fresh it
// is, so the analyzer can show "as-of date · source" and audit a value end to end.
//
// A provenance entry is { value, source, asOf } where:
//   - value:  the figure
//   - source: human-readable origin ("Yahoo Finance", "SEC EDGAR", "manual")
//   - asOf:   ISO date string (YYYY-MM-DD) the figure was reported/captured

export const SOURCES = {
  YAHOO: "Yahoo Finance",
  SEC: "SEC EDGAR",
  MANUAL: "Captura manual",
  CANDIDATE: "Watchlist candidate",
};

export function provenance(value, source, asOf) {
  return { value, source, asOf: asOf || null };
}

// Builds a per-field provenance map from a snapshot plus a single source/asOf,
// e.g. buildProvenance(snapshot, SOURCES.YAHOO, "2026-06-11").
export function buildProvenance(fields = {}, source, asOf) {
  const map = {};
  for (const [key, value] of Object.entries(fields)) {
    map[key] = provenance(value, source, asOf);
  }
  return map;
}

// Freshness classification for a UI badge. Thresholds in days.
export function freshness(asOf, { staleAfterDays = 30, today = new Date() } = {}) {
  if (!asOf) return { level: "unknown", ageDays: null };
  const asOfTime = new Date(asOf).getTime();
  if (!Number.isFinite(asOfTime)) return { level: "unknown", ageDays: null };
  const ageDays = Math.floor((today.getTime() - asOfTime) / 86_400_000);
  if (ageDays < 0) return { level: "fresh", ageDays: 0 };
  if (ageDays <= staleAfterDays) return { level: "fresh", ageDays };
  if (ageDays <= staleAfterDays * 3) return { level: "aging", ageDays };
  return { level: "stale", ageDays };
}

// Structured one-line log for ingestion auditing.
export function logProvenance(symbol, source, asOf, logger = console) {
  logger.info?.(JSON.stringify({ kind: "provenance", symbol, source, asOf })) ??
    logger.log?.(`[provenance] ${symbol} <- ${source} @ ${asOf || "?"}`);
}
