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
};

describe("watchlist table columns", () => {
  it("defines the dense 30-column dashboard table", () => {
    expect(WATCHLIST_TABLE_COLUMNS).toHaveLength(30);
    expect(WATCHLIST_TABLE_COLUMNS.map((column) => column.id)).toContain("action");
  });

  it("extracts formatted cell values", () => {
    const byId = Object.fromEntries(WATCHLIST_TABLE_COLUMNS.map((column) => [column.id, getTableCell(item, column)]));
    expect(byId.ticker).toBe("INGR");
    expect(byId.graham).toBe("APROBADA GRAHAMIANA");
    expect(byId.system).toBe("Aprobada Graham");
    expect(byId.tags).toBe("graham-approved");
  });
});
