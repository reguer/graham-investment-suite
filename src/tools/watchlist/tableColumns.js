import { fmt, pct } from "../../lib/formatters.js";
import { businessNoteFor } from "./notes.js";
import { normalizeTags } from "./watchlist.js";
import { BUFFETT_TABLE_COLUMNS, BUFFETT_UI_ENABLED } from "./buffettLabels.js";

export const WATCHLIST_TABLE_COLUMNS = [
  { id: "ticker", label: "Ticker", value: (item) => item.ticker },
  { id: "name", label: "Nombre", value: (item) => item.companyName },
  { id: "type", label: "Tipo", value: (item) => item.quoteType || "" },
  { id: "country", label: "Pais", value: (item) => item.country || "" },
  { id: "exchange", label: "Exchange", value: (item) => item.exchange || "" },
  { id: "market", label: "Mercado", value: (item) => item.market || "" },
  { id: "sector", label: "Sector", value: (item) => item.sector || "" },
  { id: "industry", label: "Industria", value: (item) => item.industry || "" },
  { id: "price", label: "Precio", value: (item) => fmt(item.livePrice) },
  { id: "currency", label: "Moneda", value: (item) => item.quoteCurrency || item.currency || "" },
  { id: "usd", label: "USD", value: (item) => (item.quoteCurrency === "USD" || item.currency === "USD" ? "Si" : "") },
  { id: "priceSource", label: "Fuente precio", value: (item) => item.quote?.source || item.lastPriceSource || "" },
  { id: "updated", label: "Actualizado", value: (item) => item.lastPriceUpdatedAt || item.sourceDate || "" },
  { id: "score", label: "Score", value: (item) => (item.score ? `${item.score.generalScore?.value ?? item.score.total} · ${item.score.generalScore?.label ?? item.score.label}` : "") },
  { id: "qualityTag", label: "Calidad", value: (item) => item.score?.qualityLayer?.label || "" },
  { id: "pe", label: "P/E", value: (item) => fmt(item.ratios?.pe ?? item.pe) },
  { id: "pb", label: "P/B", value: (item) => fmt(item.ratios?.pb ?? item.pb) },
  { id: "pePb", label: "P/E x P/B", value: (item) => fmt(item.ratios?.pePb ?? item.pePb) },
  { id: "debt", label: "Debt", value: (item) => fmt(item.ratios?.debtRatio ?? item.debtRatio) },
  { id: "current", label: "Current", value: (item) => fmt(item.ratios?.currentRatio ?? item.currentRatio) },
  { id: "quick", label: "Quick", value: (item) => fmt(item.ratios?.quickRatio ?? item.quickRatio) },
  { id: "fcf", label: "FCF", value: (item) => fmt(item.ratios?.fcf ?? item.fcf) },
  { id: "mos", label: "MoS", value: (item) => pct(item.ratios?.marginOfSafety) },
  { id: "maxDef", label: "Max defensivo", value: (item) => fmt(item.ratios?.maxDefensivePrice) },
  { id: "graham", label: "Estado Graham", value: (item) => item.classification?.label || item.classificationLabel || "" },
  { id: "system", label: "Estado final", value: (item) => item.systemStatus?.label || "" },
  { id: "alert", label: "Alerta", value: (item) => item.alertLabel || "" },
  { id: "analysis", label: "Analisis", value: (item) => item.analysisStatus || "" },
  { id: "validation", label: "Validacion", value: (item) => item.validationStatus || "" },
  { id: "tags", label: "Etiquetas", value: (item) => normalizeTags(item.tags).join(", ") },
  { id: "reason", label: "Razon", value: (item) => businessNoteFor(item) },
  { id: "action", label: "Accion", value: (item) => (item.alertLevel === "pending" ? "Captura manual" : "Ver detalle") },
];

// S86: las columnas Buffett solo se agregan cuando el flag esta encendido.
// Por defecto (BUFFETT_UI_ENABLED = false) la tabla es identica a la actual.
export function getWatchlistTableColumns({ includeBuffett = BUFFETT_UI_ENABLED } = {}) {
  return includeBuffett ? [...WATCHLIST_TABLE_COLUMNS, ...BUFFETT_TABLE_COLUMNS] : [...WATCHLIST_TABLE_COLUMNS];
}

export function getTableCell(item, column) {
  return column.value(item);
}
