// exportAnalysis: pure serializers for exporting a Graham analysis. The string
// builders here are dependency-free and unit-tested; the browser-side download
// helper (triggerDownload) is kept separate so the serializers stay testable in
// Node without a DOM.

import { COMPARE_ROWS } from "../tools/graham-analyzer/compareAnalyses.js";

// RFC-4180 quoting: wrap in quotes and double any embedded quote when the field
// contains a comma, quote or newline.
function csvField(value) {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvRow(fields) {
  return fields.map(csvField).join(",");
}

function isNum(value) {
  return typeof value === "number" && Number.isFinite(value);
}

// Serializes one or more saved analyses to CSV: a header row of tickers followed
// by one row per Graham metric. Mirrors the side-by-side comparison columns.
export function analysesToCsv(items) {
  const list = Array.isArray(items) ? items : [items];
  if (list.length === 0) return "";

  const header = ["Métrica", ...list.map((item) => item.form?.ticker || "SIN_TICKER")];
  const rows = COMPARE_ROWS.map((row) =>
    csvRow([row.label, ...list.map((item) => {
      const raw = row.get(item.ratios || {});
      return isNum(raw) ? raw : "";
    })]),
  );

  return [csvRow(header), ...rows].join("\n");
}

// Triggers a client-side file download for a text payload. Browser-only.
export function triggerDownload(filename, content, mimeType = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// A safe filename stem from a ticker (or a fallback) plus today's date.
export function exportFilename(ticker, ext) {
  const stem = (ticker || "analisis").replace(/[^a-zA-Z0-9_-]/g, "_");
  const date = new Date().toISOString().slice(0, 10);
  return `graham_${stem}_${date}.${ext}`;
}
