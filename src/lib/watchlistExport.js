import { WATCHLIST_TABLE_COLUMNS, getTableCell } from "../tools/watchlist/tableColumns.js";
import { getVisibleWatchReason } from "../tools/watchlist/watchReason.js";

const PDF_COLUMN_IDS = ["ticker", "name", "sector", "price", "score", "qualityTag", "pe", "pb", "pePb", "mos", "maxDef", "graham", "system", "tags", "reason"];
const EXCLUDED_EXPORT_COLUMN_IDS = new Set(["action"]);
const COLUMN_WIDTHS = {
  ticker: 12,
  name: 28,
  type: 14,
  country: 16,
  exchange: 14,
  market: 14,
  sector: 20,
  industry: 24,
  price: 12,
  currency: 10,
  usd: 8,
  priceSource: 16,
  updated: 20,
  score: 16,
  qualityTag: 18,
  pe: 10,
  pb: 10,
  pePb: 12,
  debt: 10,
  current: 10,
  quick: 10,
  fcf: 14,
  mos: 12,
  maxDef: 14,
  graham: 24,
  system: 22,
  alert: 18,
  analysis: 16,
  validation: 18,
  tags: 28,
  reason: 42,
};

function sanitizeToken(value) {
  return String(value || "watchlist")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase() || "watchlist";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getExportCell(item, column) {
  if (column.id === "reason") return getVisibleWatchReason(item);
  return getTableCell(item, column);
}

function computeColumnWidths(sheetData, columns) {
  const header = sheetData[0] || [];
  return header.map((label, index) => {
    const longestCell = sheetData.reduce((max, row) => Math.max(max, String(row[index] ?? "").length), String(label || "").length);
    const preferredWidth = COLUMN_WIDTHS[columns[index]?.id] || 14;
    return { wch: Math.min(48, Math.max(preferredWidth, Math.min(longestCell + 2, preferredWidth + 8))) };
  });
}

function computeRowHeights(sheetData, columns) {
  return sheetData.map((row, rowIndex) => {
    if (rowIndex === 0) return { hpt: 24 };
    const estimatedLines = row.reduce((maxLines, cell, columnIndex) => {
      const width = COLUMN_WIDTHS[columns[columnIndex]?.id] || 14;
      const text = String(cell ?? "");
      const lines = Math.max(1, Math.ceil(text.length / Math.max(width - 2, 8)));
      return Math.max(maxLines, lines);
    }, 1);
    return { hpt: Math.min(90, Math.max(20, estimatedLines * 14)) };
  });
}

function applyCellWrapping(worksheet, sheetData) {
  sheetData.forEach((row, rowIndex) => {
    row.forEach((_, columnIndex) => {
      const cellRef = `${columnToName(columnIndex)}${rowIndex + 1}`;
      if (!worksheet[cellRef]) return;
      worksheet[cellRef].s = {
        alignment: {
          vertical: "top",
          wrapText: true,
        },
      };
    });
  });
}

function columnToName(index) {
  let value = index;
  let label = "";
  while (value >= 0) {
    label = String.fromCharCode((value % 26) + 65) + label;
    value = Math.floor(value / 26) - 1;
  }
  return label;
}

function pdfColumnWidth(columnId) {
  if (columnId === "reason") return "34ch";
  if (columnId === "name") return "24ch";
  if (columnId === "tags") return "22ch";
  if (["graham", "system"].includes(columnId)) return "18ch";
  if (["ticker", "price", "pe", "pb", "pePb", "mos", "maxDef"].includes(columnId)) return "10ch";
  return "14ch";
}

export function getWatchlistExportColumns(columns = WATCHLIST_TABLE_COLUMNS) {
  return columns.filter((column) => !EXCLUDED_EXPORT_COLUMN_IDS.has(column.id));
}

export function getWatchlistPdfColumns(columns = WATCHLIST_TABLE_COLUMNS) {
  const wanted = new Set(PDF_COLUMN_IDS);
  return columns.filter((column) => wanted.has(column.id));
}

export function watchlistSheetData(items, columns = getWatchlistExportColumns()) {
  const rows = Array.isArray(items) ? items : [];
  return [
    columns.map((column) => column.label),
    ...rows.map((item) =>
      columns.map((column) => {
        const value = getExportCell(item, column);
        return value === null || value === undefined ? "" : String(value);
      })),
  ];
}

export function watchlistRowsForExport(items, columns = getWatchlistExportColumns()) {
  const rows = Array.isArray(items) ? items : [];
  return rows.map((item) =>
    Object.fromEntries(
      columns.map((column) => {
        const value = getExportCell(item, column);
        return [column.label, value === null || value === undefined ? "" : String(value)];
      }),
    ),
  );
}

export function buildWatchlistExportSummary({
  viewLabel,
  query,
  signalLabel,
  sectorLabel,
  tagLabel,
  statusLabel,
  sortLabel,
  count,
}) {
  return [
    `Vista: ${viewLabel || "Filtro actual"}`,
    `Registros: ${count ?? 0}`,
    query ? `Busqueda: ${query}` : null,
    signalLabel ? `Senal: ${signalLabel}` : null,
    sectorLabel ? `Sector: ${sectorLabel}` : null,
    tagLabel ? `Etiqueta: ${tagLabel}` : null,
    statusLabel ? `Estado: ${statusLabel}` : null,
    sortLabel ? `Orden: ${sortLabel}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function watchlistExportFilename(viewLabel, ext) {
  const date = new Date().toISOString().slice(0, 10);
  return `watchlist_${sanitizeToken(viewLabel)}_${date}.${ext}`;
}

export async function exportWatchlistToXlsx({ items, viewLabel, filtersSummary, columns = getWatchlistExportColumns() }) {
  const { utils, writeFileXLSX } = await import("xlsx");
  const sheetData = watchlistSheetData(items, columns);
  const workbook = utils.book_new();
  const worksheet = utils.aoa_to_sheet(sheetData);
  worksheet["!cols"] = computeColumnWidths(sheetData, columns);
  worksheet["!rows"] = computeRowHeights(sheetData, columns);
  applyCellWrapping(worksheet, sheetData);
  if (sheetData.length > 1) {
    worksheet["!autofilter"] = { ref: utils.encode_range({ s: { r: 0, c: 0 }, e: { r: sheetData.length - 1, c: columns.length - 1 } }) };
  }

  const metadata = [
    ["Vista", viewLabel || "Filtro actual"],
    ["Registros", Array.isArray(items) ? items.length : 0],
    ["Filtros", filtersSummary || "Sin filtros adicionales"],
    ["Generado", new Date().toLocaleString("es-MX")],
  ];

  utils.book_append_sheet(workbook, utils.aoa_to_sheet(metadata), "Resumen");
  utils.book_append_sheet(workbook, worksheet, "Watchlist");

  const filename = watchlistExportFilename(viewLabel, "xlsx");
  writeFileXLSX(workbook, filename);
  return filename;
}

export function buildWatchlistPrintHtml({ items, viewLabel, filtersSummary, columns = getWatchlistPdfColumns() }) {
  const rows = watchlistSheetData(items, columns);
  const [header, ...body] = rows;
  const generatedAt = new Date().toLocaleString("es-MX");

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(viewLabel || "Watchlist")}</title>
    <style>
      @page { size: landscape; margin: 10mm; }
      * { box-sizing: border-box; }
      body { margin: 0; padding: 24px; color: #111827; font: 12px/1.4 "IBM Plex Mono", "Courier New", monospace; }
      h1 { margin: 0 0 8px; font-size: 24px; }
      .meta { margin-bottom: 16px; color: #4b5563; }
      .meta strong { color: #111827; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      thead { display: table-header-group; }
      th, td { border: 1px solid #d1d5db; padding: 6px 7px; vertical-align: top; word-break: break-word; overflow-wrap: anywhere; white-space: normal; }
      th { background: #f3f4f6; text-align: left; }
      tbody tr:nth-child(even) { background: #fafafa; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(viewLabel || "Watchlist filtrada")}</h1>
    <div class="meta"><strong>Generado:</strong> ${escapeHtml(generatedAt)}<br /><strong>Filtros:</strong> ${escapeHtml(filtersSummary || "Sin filtros adicionales")}</div>
    <table>
      <colgroup>
        ${columns.map((column) => `<col style="width:${pdfColumnWidth(column.id)}" />`).join("")}
      </colgroup>
      <thead>
        <tr>${header.map((label) => `<th>${escapeHtml(label)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${body
          .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
          .join("")}
      </tbody>
    </table>
    <script>
      window.addEventListener("load", () => {
        window.focus();
        setTimeout(() => window.print(), 150);
      });
    </script>
  </body>
</html>`;
}

export function openWatchlistPrintPreview(options) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) throw new Error("El navegador bloqueo la ventana emergente para exportar PDF.");
  printWindow.document.open();
  printWindow.document.write(buildWatchlistPrintHtml(options));
  printWindow.document.close();
}
