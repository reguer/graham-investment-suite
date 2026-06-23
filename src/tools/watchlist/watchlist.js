import { grahamCandidates } from "../graham-analyzer/candidates.js";
import { tickerUniverse, universeMeta } from "./universe.js";
import { businessNoteFor } from "./notes.js";

export const DEFAULT_ALERT_POLICY = {
  nearPePb: 28,
  nearPe: 22,
  nearPb: 2.3,
  nearDebtRatio: 1.2,
  nearCurrentRatio: 1.8,
  grahamDistancePct: 0.15,
};

function buildCandidateTags(candidate) {
  const tags = ["manual-candidate"];
  if (candidate.pePb <= 22.5 && candidate.pe <= 20 && candidate.pb <= 2) tags.push("graham-watch");
  if (candidate.sector) tags.push(String(candidate.sector).split("/")[0].trim().toLowerCase().replace(/\s+/g, "-"));
  return tags;
}

export const analyzedWatchlist = grahamCandidates.map((candidate) => ({
  ...candidate,
  analysisStatus: "analyzed",
  yahooSymbol: candidate.yahooSymbol || candidate.ticker,
  market: candidate.market || "US",
  watchReason: candidate.note,
  tags: buildCandidateTags(candidate),
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

  if (
    item.analysisStatus === "index_reference" ||
    item.analysisStatus === "market_reference" ||
    item.validationStatus === "index_reference" ||
    item.validationStatus === "market_reference" ||
    item.tags?.includes("index_reference") ||
    item.tags?.includes("market_reference") ||
    ["INDEX", "ETF", "FUTURE"].includes(String(item.quoteType || "").toUpperCase())
  ) {
    return {
      ...item,
      yahooSymbol: item.yahooSymbol || item.ticker,
      watchReason: item.watchReason || item.notes || "Referencia de mercado. No requiere analisis Graham.",
      tags: item.tags?.length ? item.tags : ["market_reference"],
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
  const latestUpdate = publicCompanies
    .map((item) => item.lastPriceUpdatedAt || item.lastPriceDate || item.sourceDate)
    .filter(Boolean)
    .sort((a, b) => String(b).localeCompare(String(a)))[0] || universeMeta.sourceDate;
  return {
    ...universeMeta,
    publicExportCount: publicCompanies.length,
    analyzedCount: watchlist.filter((item) => item.analysisStatus === "analyzed").length,
    referenceCount: watchlist.filter((item) => (
      item.analysisStatus === "index_reference" ||
      item.analysisStatus === "market_reference" ||
      item.validationStatus === "index_reference" ||
      item.validationStatus === "market_reference" ||
      ["INDEX", "ETF", "FUTURE"].includes(String(item.quoteType || "").toUpperCase())
    )).length,
    pendingCount: watchlist.filter((item) => (
      item.analysisStatus !== "analyzed" &&
      item.analysisStatus !== "index_reference" &&
      item.analysisStatus !== "market_reference" &&
      item.validationStatus !== "index_reference" &&
      item.validationStatus !== "market_reference"
    )).length,
    totalCount: watchlist.length,
    dataUpdatedAt: latestUpdate,
  };
}

export function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim()).filter(Boolean);
  return String(tags || "").split(",").map((tag) => tag.trim()).filter(Boolean);
}

export function collectTags(items) {
  const tags = new Set();
  for (const item of items) {
    for (const tag of normalizeTags(item.tags)) tags.add(tag);
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
}

export function collectSectors(items) {
  const sectors = new Set();
  for (const item of items) {
    const sector = String(item.sector || "").trim();
    if (sector) sectors.add(sector);
  }
  return [...sectors].sort((a, b) => a.localeCompare(b));
}

export { businessNoteFor };

export const publicCompanies = [];
export const watchlist = buildWatchlist(publicCompanies);
export const watchlistMeta = buildWatchlistMeta(watchlist, publicCompanies);
