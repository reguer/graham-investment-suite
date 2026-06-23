const FETCH_FAILED_STATUSES = new Set(["yahoo_fetch_failed"]);
const PARTIAL_STATUSES = new Set(["yahoo_partial_incomplete", "analysis_partial_yahoo"]);

function isMarketReference(item) {
  return (
    item.analysisStatus === "index_reference" ||
    item.analysisStatus === "market_reference" ||
    item.validationStatus === "index_reference" ||
    item.validationStatus === "market_reference" ||
    ["INDEX", "ETF", "FUTURE"].includes(String(item.quoteType || "").toUpperCase())
  );
}

export function classifyDataIssue(item) {
  if (isMarketReference(item)) {
    return {
      severity: "info",
      status: "Referencia",
      source: "Yahoo Chart",
      action: "No aplicar Graham; usar como contexto de mercado.",
    };
  }

  if (FETCH_FAILED_STATUSES.has(item.validationStatus) || item.validationStatus === "source_required") {
    return {
      severity: "high",
      status: "Fuente pendiente",
      source: "Pendiente de revision",
      action: "Decidir si la empresa merece captura financiera manual o si se descarta del radar.",
    };
  }

  if (PARTIAL_STATUSES.has(item.validationStatus)) {
    return {
      severity: "medium",
      status: "Snapshot parcial",
      source: "Informacion parcial",
      action: "Mantener en observacion hasta que exista base suficiente para una lectura Graham.",
    };
  }

  if (item.analysisStatus !== "analyzed" && item.analysisStatus !== "index_reference") {
    return {
      severity: "medium",
      status: "Datos insuficientes",
      source: "Informacion insuficiente",
      action: "Revisar si sigue siendo parte del universo o si requiere captura manual.",
    };
  }

  return null;
}

export function buildDataIssueRows(items) {
  return items
    .map((item) => ({ item, issue: classifyDataIssue(item) }))
    .filter(({ issue }) => issue && issue.severity !== "info")
    .map(({ item, issue }) => ({
      ticker: item.ticker,
      yahooSymbol: item.yahooSymbol || item.yahoo_symbol || item.ticker,
      companyName: item.companyName,
      validationStatus: item.validationStatus || "",
      notes: businessNoteFor(item),
      ...issue,
    }))
    .sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 };
      return (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9) || a.ticker.localeCompare(b.ticker);
    });
}
import { businessNoteFor } from "./notes.js";
