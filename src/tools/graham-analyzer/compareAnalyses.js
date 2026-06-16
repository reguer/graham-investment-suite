// compareAnalyses: pure logic for the side-by-side comparison view. It declares
// which Graham metrics are compared, how each is formatted, and which direction
// counts as "better", so the UI can highlight the best value per row without
// embedding judgement rules in JSX. Kept dependency-light and unit-tested.

import { fmt, pct } from "../../lib/formatters.js";

// dir: "lower" → a smaller finite number is better (valuation, leverage);
//      "higher" → a larger finite number is better (liquidity, margins, MoS).
// Rows read ratios off a saved analysis item ({ form, ratios, classification }).
export const COMPARE_ROWS = [
  { key: "pe", label: "P/E", dir: "lower", get: (r) => r.pe, format: fmt },
  { key: "pb", label: "P/B", dir: "lower", get: (r) => r.pb, format: fmt },
  { key: "pePb", label: "P/E × P/B", dir: "lower", get: (r) => r.pePb, format: fmt },
  { key: "mosGraham", label: "Margen de seguridad", dir: "higher", get: (r) => r.mosGraham, format: pct },
  { key: "debtRatio", label: "Deuda / patrimonio", dir: "lower", get: (r) => r.debtRatio, format: fmt },
  { key: "currentRatio", label: "Ratio corriente", dir: "higher", get: (r) => r.currentRatio, format: fmt },
  { key: "roe", label: "ROE", dir: "higher", get: (r) => r.roe, format: pct },
  { key: "netMargin", label: "Margen neto", dir: "higher", get: (r) => r.netMargin, format: pct },
  { key: "epsCagr", label: "CAGR EPS", dir: "higher", get: (r) => r.epsCagr, format: pct },
];

function isNum(value) {
  return typeof value === "number" && Number.isFinite(value);
}

// Given the row definition and the selected items, returns the index of the item
// with the best value, or -1 when fewer than 2 items have a comparable number
// (highlighting a single value as "best" against blanks would be misleading).
export function bestIndexForRow(row, items) {
  const values = items.map((item) => row.get(item.ratios || {}));
  const comparable = values.filter(isNum);
  if (comparable.length < 2) return -1;

  let bestIndex = -1;
  let bestValue = null;
  values.forEach((value, index) => {
    if (!isNum(value)) return;
    if (bestValue === null || (row.dir === "lower" ? value < bestValue : value > bestValue)) {
      bestValue = value;
      bestIndex = index;
    }
  });
  return bestIndex;
}

// Builds the full comparison matrix: one entry per row, each carrying the
// formatted cell for every item plus which column is best.
export function buildComparison(items) {
  return COMPARE_ROWS.map((row) => ({
    key: row.key,
    label: row.label,
    bestIndex: bestIndexForRow(row, items),
    cells: items.map((item) => {
      const raw = row.get(item.ratios || {});
      return { raw, text: isNum(raw) ? row.format(raw) : "N/D" };
    }),
  }));
}
