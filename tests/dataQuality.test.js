import { describe, expect, it } from "vitest";
import { buildDataIssueRows, classifyDataIssue } from "../src/tools/watchlist/dataQuality.js";

describe("watchlist data quality", () => {
  it("does not treat market references as Graham data issues", () => {
    const issue = classifyDataIssue({ ticker: "GOLD", quoteType: "FUTURE", analysisStatus: "market_reference" });
    expect(issue.status).toBe("Referencia");
    expect(buildDataIssueRows([{ ticker: "GOLD", quoteType: "FUTURE", analysisStatus: "market_reference" }])).toHaveLength(0);
  });

  it("creates rows for source-required equities", () => {
    const rows = buildDataIssueRows([
      { ticker: "HOLX", quoteType: "EQUITY", validationStatus: "source_required", analysisStatus: "analysis_external_pending", notes: "Alias pendiente" },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].ticker).toBe("HOLX");
    expect(rows[0].status).toBe("Fuente pendiente");
  });

  it("prioritizes fetch failures before partial snapshots", () => {
    const rows = buildDataIssueRows([
      { ticker: "FITB", validationStatus: "yahoo_partial_incomplete" },
      { ticker: "CMA", validationStatus: "yahoo_fetch_failed" },
    ]);

    expect(rows.map((row) => row.ticker)).toEqual(["CMA", "FITB"]);
  });

  it("does not flag analyzed companies only because the Yahoo snapshot was partial", () => {
    expect(buildDataIssueRows([
      { ticker: "ED", validationStatus: "yahoo_partial_incomplete", analysisStatus: "analyzed" },
    ])).toHaveLength(0);
  });
});
