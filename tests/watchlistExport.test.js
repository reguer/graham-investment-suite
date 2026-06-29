import { describe, expect, it } from "vitest";
import {
  buildWatchlistExportSummary,
  buildWatchlistPrintHtml,
  buildWatchlistWorksheetRows,
  getWatchlistExportColumns,
  getWatchlistPdfColumns,
  watchlistExportFilename,
  watchlistRowsForExport,
} from "../src/lib/watchlistExport.js";

const item = {
  ticker: "MU",
  companyName: "Micron Technology, Inc.",
  sector: "Technology",
  livePrice: 145.23,
  alertLevel: "watch",
  classification: { label: "EXCELENTE, PERO CARA" },
  systemStatus: { label: "En observacion" },
  score: {
    total: 43,
    label: "Debil",
    qualityLayer: { label: "Alta calidad" },
  },
  ratios: {
    pe: 14.2,
    pb: 2.1,
    pePb: 29.82,
    marginOfSafety: -0.12,
    maxDefensivePrice: 128.47,
  },
  tags: ["requested", "pending-analysis"],
  watchReason: "Excelente negocio operativo, pero el precio actual excede el rango defensivo Graham y requiere disciplina de entrada.",
};

describe("watchlist export helpers", () => {
  it("excludes UI-only columns from spreadsheet exports", () => {
    const columns = getWatchlistExportColumns();
    expect(columns.map((column) => column.id)).not.toContain("action");
    expect(columns.map((column) => column.id)).toContain("qualityTag");
  });

  it("keeps a compact set of columns for the printable PDF view", () => {
    expect(getWatchlistPdfColumns().map((column) => column.id)).toEqual([
      "ticker",
      "name",
      "sector",
      "price",
      "score",
      "qualityTag",
      "pe",
      "pb",
      "pePb",
      "mos",
      "maxDef",
      "graham",
      "system",
      "tags",
      "reason",
    ]);
  });

  it("serializes rows using visible business notes", () => {
    const [row] = watchlistRowsForExport([item]);
    expect(row.Ticker).toBe("MU");
    expect(row.Calidad).toBe("Alta calidad");
    expect(row.Razon).toContain("Excelente negocio operativo");
  });

  it("builds a readable filter summary", () => {
    expect(buildWatchlistExportSummary({
      viewLabel: "Excelente, cara (12)",
      query: "mu",
      signalLabel: "Observacion",
      sectorLabel: "Technology",
      tagLabel: "requested",
      statusLabel: "Rechazada por modelo",
      sortLabel: "Orden por score",
      count: 12,
    })).toContain("Vista: Excelente, cara (12)");
  });

  it("builds worksheet rows with summary line above the header", () => {
    const rows = buildWatchlistWorksheetRows({
      items: [item],
      filtersSummary: "Vista: Excelente, cara (1) · Registros: 1",
    });
    expect(rows[0][0]).toContain("Vista: Excelente, cara (1)");
    expect(rows[2][0]).toBe("Ticker");
    expect(rows[3][0]).toBe("MU");
  });

  it("sanitizes export filenames", () => {
    expect(watchlistExportFilename("Excelente, cara (12)", "xlsx")).toMatch(/^watchlist_excelente_cara_12_\d{4}-\d{2}-\d{2}\.xlsx$/);
  });

  it("renders print HTML with wrapped cells and explicit column widths", () => {
    const html = buildWatchlistPrintHtml({
      items: [item],
      viewLabel: "Excelente, cara (1)",
      filtersSummary: "Vista: Excelente, cara (1) · Registros: 1",
    });
    expect(html).toContain("overflow-wrap: anywhere");
    expect(html).toContain("<colgroup>");
    expect(html).toContain("Imprimir / Guardar PDF");
    expect(html).toContain("Micron Technology, Inc.");
  });
});
