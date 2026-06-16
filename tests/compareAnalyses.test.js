import { describe, expect, it } from "vitest";
import { bestIndexForRow, buildComparison, COMPARE_ROWS } from "../src/tools/graham-analyzer/compareAnalyses.js";

const row = (key) => COMPARE_ROWS.find((r) => r.key === key);

function item(ratios) {
  return { id: String(Math.random()), form: { ticker: "X" }, classification: { label: "L", color: "#fff" }, ratios };
}

describe("bestIndexForRow", () => {
  it("picks the lowest value when dir=lower (P/E)", () => {
    const items = [item({ pe: 18 }), item({ pe: 9 }), item({ pe: 25 })];
    expect(bestIndexForRow(row("pe"), items)).toBe(1);
  });

  it("picks the highest value when dir=higher (ROE)", () => {
    const items = [item({ roe: 0.1 }), item({ roe: 0.22 }), item({ roe: 0.15 })];
    expect(bestIndexForRow(row("roe"), items)).toBe(1);
  });

  it("returns -1 when fewer than 2 comparable numbers", () => {
    const items = [item({ pe: 12 }), item({ pe: null })];
    expect(bestIndexForRow(row("pe"), items)).toBe(-1);
  });

  it("ignores non-finite values when choosing the best", () => {
    const items = [item({ currentRatio: null }), item({ currentRatio: 2.1 }), item({ currentRatio: 3.4 })];
    expect(bestIndexForRow(row("currentRatio"), items)).toBe(2);
  });
});

describe("buildComparison", () => {
  it("produces one entry per declared row with formatted cells", () => {
    const items = [item({ pe: 10 }), item({ pe: 20 })];
    const comparison = buildComparison(items);
    expect(comparison).toHaveLength(COMPARE_ROWS.length);
    const peRow = comparison.find((r) => r.key === "pe");
    expect(peRow.cells.map((c) => c.text)).toEqual(["10.00", "20.00"]);
    expect(peRow.bestIndex).toBe(0);
  });

  it("renders N/D for missing metrics", () => {
    const items = [item({ pe: 10 }), item({})];
    const peRow = buildComparison(items).find((r) => r.key === "pe");
    expect(peRow.cells[1].text).toBe("N/D");
    expect(peRow.bestIndex).toBe(-1);
  });
});
