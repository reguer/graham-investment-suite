import { describe, expect, it } from "vitest";
import { WATCHLIST_TABLE_COLUMNS, getTableCell } from "../src/tools/watchlist/tableColumns.js";

const item = {
  ticker: "INGR",
  companyName: "Ingredion Incorporated",
  quoteType: "EQUITY",
  country: "United States",
  exchange: "NYSE",
  market: "US",
  sector: "Consumer Defensive",
  industry: "Packaged Foods",
  livePrice: 51.42,
  currency: "USD",
  quoteCurrency: "USD",
  lastPriceSource: "Yahoo",
  sourceDate: "2026-06-08",
  ratios: { pe: 10, pb: 0.8, pePb: 8, debtRatio: 0.7, currentRatio: 2.2, quickRatio: 0.4, fcf: 100, marginOfSafety: 0.25, maxDefensivePrice: 70 },
  classification: { label: "APROBADA GRAHAMIANA" },
  systemStatus: { label: "Aprobada Graham" },
  alertLabel: "Aprobada Graham",
  analysisStatus: "analyzed",
  validationStatus: "sec_auto_snapshot",
  tags: ["graham-approved"],
  watchReason: "Cumple criterios defensivos.",
  score: {
    total: 88,
    label: "Excelente",
    generalScore: { value: 88, label: "Excelente" },
  },
};

describe("watchlist table columns", () => {
  it("defines the dense 32-column dashboard table", () => {
    expect(WATCHLIST_TABLE_COLUMNS).toHaveLength(32);
    expect(WATCHLIST_TABLE_COLUMNS.map((column) => column.id)).toContain("action");
    expect(WATCHLIST_TABLE_COLUMNS.map((column) => column.id)).toContain("score");
    expect(WATCHLIST_TABLE_COLUMNS.map((column) => column.id)).toContain("qualityTag");
  });

  it("extracts formatted cell values", () => {
    const byId = Object.fromEntries(WATCHLIST_TABLE_COLUMNS.map((column) => [column.id, getTableCell(item, column)]));
    expect(byId.ticker).toBe("INGR");
    expect(byId.graham).toBe("APROBADA GRAHAMIANA");
    expect(byId.score).toBe("88 · Excelente");
    expect(byId.qualityTag).toBe("");
    expect(byId.system).toBe("Aprobada Graham");
    expect(byId.tags).toBe("graham-approved");
  });

  it("does not expose technical extraction notes as company notes", () => {
    const reasonColumn = WATCHLIST_TABLE_COLUMNS.find((column) => column.id === "reason");
    expect(getTableCell({
      ticker: "AAOI",
      companyName: "Applied Optoelectronics",
      analysisStatus: "analysis_unsupported",
      watchReason: "SEC no devolvio campos minimos para ratios Graham.",
    }, reasonColumn)).toBe("Revision pendiente: no hay base financiera suficiente para emitir una tesis de empresa.");
  });
});
