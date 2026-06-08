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

export function normalizeExportedCompany(company) {
  return {
    ...company,
    yahooSymbol: company.yahooSymbol || company.yahoo_symbol || company.ticker,
    companyName: company.companyName || company.company_name || company.name || company.ticker,
    quoteType: company.quoteType || company.quote_type || "EQUITY",
    analysisStatus: company.analysisStatus || company.analysis_status || "pending_fundamentals",
    validationStatus: company.validationStatus || company.validation_status || "needs_manual_review",
    sourceDate: company.sourceDate || company.source_date,
    notes: company.notes || company.note || "",
  };
}

export async function fetchPublicCompanies(fetchImpl = fetch, baseUrl = "/") {
  try {
    const response = await fetchImpl(`${baseUrl.replace(/\/?$/, "/")}data/companies.json`);
    if (!response.ok) throw new Error(`No se pudo cargar companies.json: ${response.status}`);
    const payload = await response.json();
    return Array.isArray(payload) ? payload.map(normalizeExportedCompany) : [];
  } catch {
    return [];
  }
}

function mergeByTicker(sources) {
  const byTicker = new Map();
  for (const source of sources) {
    for (const item of source) {
      const key = item.ticker.toUpperCase();
      byTicker.set(key, { ...(byTicker.get(key) || {}), ...item });
    }
  }
  return [...byTicker.values()];
}

export function buildWatchlist(publicCompanies = []) {
  const persistedUniverse = mergeByTicker([tickerUniverse, publicCompanies]);
  const universeWatchlist = persistedUniverse.map((item) => {
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

  if (item.analysisStatus === "analyzed") {
    return {
      ...item,
      yahooSymbol: item.yahooSymbol || item.ticker,
      market: item.market || "US",
      watchReason: item.watchReason || item.notes || "Analisis Graham automatico desde export publico.",
      tags: item.tags?.length ? item.tags : ["sec-auto-analysis"],
    };
  }

  if (String(item.analysisStatus || "").startsWith("analysis_")) {
    return {
      ...item,
      yahooSymbol: item.yahooSymbol || item.ticker,
      watchReason: item.watchReason || item.notes || "No se pudo completar el analisis automatico.",
      tags: item.tags?.length ? item.tags : ["analysis-review"],
    };
  }

  return {
    ...item,
    analysisStatus: "pending_fundamentals",
    watchReason: "Pendiente de primer analisis Graham: requiere fundamentales de Yahoo Finance o captura manual validada.",
    tags: [item.priority === "requested" ? "requested" : "bmv-sic", "pending-analysis"],
  };
});

  const universeTickerKeys = new Set(persistedUniverse.map((item) => item.ticker.toUpperCase()));
  const analyzedOutsideUniverse = analyzedWatchlist.filter((item) => !universeTickerKeys.has(item.ticker.toUpperCase()));

  return [...universeWatchlist, ...analyzedOutsideUniverse];
}

export function buildWatchlistMeta(watchlist, publicCompanies = []) {
  return {
    ...universeMeta,
    publicExportCount: publicCompanies.length,
    analyzedCount: watchlist.filter((item) => item.analysisStatus === "analyzed").length,
    pendingCount: watchlist.filter((item) => item.analysisStatus !== "analyzed").length,
    totalCount: watchlist.length,
  };
}

export const publicCompanies = [];
export const watchlist = buildWatchlist(publicCompanies);
export const watchlistMeta = buildWatchlistMeta(watchlist, publicCompanies);
