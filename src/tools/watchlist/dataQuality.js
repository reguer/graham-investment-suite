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
      source: "Yahoo base/alias, SEC EDGAR o captura manual",
      action: "Validar alias Yahoo y, si falla, capturar estados financieros manualmente desde Yahoo Finance.",
    };
  }

  if (PARTIAL_STATUSES.has(item.validationStatus)) {
    return {
      severity: "medium",
      status: "Snapshot parcial",
      source: "Yahoo fundamentalsTimeSeries",
      action: "Reintentar en siguiente corrida; si no hay estados anuales, capturar EPS/history manual.",
    };
  }

  if (item.analysisStatus !== "analyzed" && item.analysisStatus !== "index_reference") {
    return {
      severity: "medium",
      status: "Datos insuficientes",
      source: "Yahoo Finance / SEC EDGAR",
      action: "Completar al menos 3 de 5 ratios criticos y validar moneda.",
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
      notes: item.notes || item.watchReason || "",
      ...issue,
    }))
    .sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 };
      return (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9) || a.ticker.localeCompare(b.ticker);
    });
}
