import { AC } from "./colors.js";

// Single source of truth for "is there a value or not" so the UI never paints a
// verdict color (green/red) over missing data. A missing metric is "na" → N/D, gray.
export const NA_PLACEHOLDER = "N/D";

export function metricState(value) {
  return value === null || value === undefined || (typeof value === "number" && Number.isNaN(value))
    ? "na"
    : "ok";
}

// displayValue(value, formatter): formats only when data exists, else "N/D".
export function displayValue(value, formatter) {
  return metricState(value) === "na" ? NA_PLACEHOLDER : formatter(value);
}

// colorForState(value, evaluator): returns AC.gray when data is missing, otherwise
// delegates the verdict color to `evaluator(value)`. This guards against the
// `null < threshold` foot-gun that previously painted missing data green/red.
export function colorForState(value, evaluator) {
  return metricState(value) === "na" ? AC.gray : evaluator(value);
}

// Tri-state boolean for criteria that can be true / false / unknown (e.g. epsGrowing).
// Returns "pass" | "fail" | "unknown".
export function boolState(value) {
  if (value === null || value === undefined) return "unknown";
  return value ? "pass" : "fail";
}
