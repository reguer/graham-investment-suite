import { describe, expect, it } from "vitest";
import { analysesToCsv, exportFilename } from "../src/lib/exportAnalysis.js";

function item(ticker, ratios) {
  return { form: { ticker }, ratios };
}

describe("analysesToCsv", () => {
  it("builds a header of tickers and one row per metric", () => {
    const csv = analysesToCsv([item("AAA", { pe: 10, pb: 1.5 }), item("BBB", { pe: 20, pb: 3 })]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Métrica,AAA,BBB");
    expect(lines).toContain("P/E,10,20");
    expect(lines).toContain("P/B,1.5,3");
  });

  it("accepts a single analysis (not wrapped in an array)", () => {
    const csv = analysesToCsv(item("AAA", { pe: 12 }));
    expect(csv.split("\n")[0]).toBe("Métrica,AAA");
  });

  it("leaves missing metrics blank rather than writing 0 or null", () => {
    const csv = analysesToCsv([item("AAA", { pe: 12 })]);
    const peLine = csv.split("\n").find((l) => l.startsWith("P/E,"));
    const roeLine = csv.split("\n").find((l) => l.startsWith("ROE,"));
    expect(peLine).toBe("P/E,12");
    expect(roeLine).toBe("ROE,");
  });

  it("quotes fields containing commas or quotes", () => {
    const csv = analysesToCsv(item('A,"B', {}));
    expect(csv.split("\n")[0]).toBe('Métrica,"A,""B"');
  });

  it("returns an empty string for an empty list", () => {
    expect(analysesToCsv([])).toBe("");
  });
});

describe("exportFilename", () => {
  it("sanitizes the ticker and appends today's date and extension", () => {
    const name = exportFilename("BRK.B", "csv");
    expect(name).toMatch(/^graham_BRK_B_\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it("falls back to a default stem when ticker is empty", () => {
    expect(exportFilename("", "csv")).toMatch(/^graham_analisis_/);
  });
});
