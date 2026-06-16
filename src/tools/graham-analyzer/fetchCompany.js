import { EMPTY_FORM } from "./constants.js";
import {
  fetchSecTickerMap,
  fetchSecCompanyFacts,
  fetchSecSicCode,
  buildSecGrahamSnapshot,
} from "../watchlist/secFundamentals.js";

const str = (value) => (value === null || value === undefined || Number.isNaN(value) ? "" : String(value));

// snapshotToForm(snapshot): pure mapping from a SEC/Yahoo Graham snapshot to the
// manual analyzer form, so "Buscar por ticker" pre-fills the fields the user would
// otherwise type by hand. Unmapped fields stay empty for manual completion.
export function snapshotToForm(snapshot = {}, { ticker = "", companyName = "", sector = "" } = {}) {
  const sec = snapshot.sec || {};
  const form = {
    ...EMPTY_FORM,
    ticker: ticker.toUpperCase(),
    companyName,
    sector,
    date: snapshot.sourceDate || new Date().toISOString().slice(0, 10),
    price: str(snapshot.price),
    totalAssets: str(sec.assets),
    currentAssets: str(sec.currentAssets),
    inventory: str(sec.inventory),
    totalLiabilities: str(sec.liabilities),
    currentLiabilities: str(sec.currentLiabilities),
    equity: str(sec.equity),
    sharesOutstanding: str(sec.shares),
    netIncome: str(sec.netIncome),
    operatingCF: str(sec.operatingCashFlow),
    investingCF: str(sec.investingCashFlow),
    epsTTM: str(snapshot.epsAdj),
    notes: `Autollenado desde ${snapshot.source || "fuente automática"}. Verificar antes de analizar.`,
  };

  // EPS history (newest first) -> eps1..eps5 + their years.
  (snapshot.epsHistory || []).slice(0, 5).forEach((entry, index) => {
    form[`eps${index + 1}`] = str(entry.eps);
    if (entry.year) form[`epsYear${index + 1}`] = String(entry.year);
  });

  return form;
}

// fetchCompanyByTicker(ticker): resolves a ticker to a pre-filled form via SEC EDGAR
// (companyfacts + SIC). Price is optional — SEC has no live quote, so callers may
// pass one in. Network calls are retried (withRetry inside the SEC helpers).
export async function fetchCompanyByTicker(ticker, { fetchImpl = fetch, price = null } = {}) {
  const symbol = String(ticker || "").trim().toUpperCase();
  if (!symbol) throw new Error("Ticker vacío.");

  const tickerMap = await fetchSecTickerMap(fetchImpl);
  const entry = tickerMap.get(symbol);
  if (!entry) throw new Error(`Ticker ${symbol} no encontrado en el índice SEC.`);

  const [companyFacts, sicCode] = await Promise.all([
    fetchSecCompanyFacts(entry.cik, fetchImpl),
    fetchSecSicCode(entry.cik, fetchImpl).catch(() => null),
  ]);

  const snapshot = buildSecGrahamSnapshot(companyFacts, price, { sicCode });
  return snapshotToForm(snapshot, { ticker: symbol, companyName: entry.title || "", sector: "" });
}
