import { AC } from "../../lib/colors.js";
import { p } from "../../lib/formatters.js";

export function alertForIndicator(indicator) {
  const value = p(indicator.value);
  if (value === null) return AC.gray;
  if (indicator.id.includes("pmi")) return value >= 52 ? AC.green : value >= 50 ? AC.yellow : AC.red;
  if (indicator.id.includes("cpi") || indicator.id.includes("inpc")) return value <= 3 ? AC.green : value <= 5 ? AC.yellow : AC.red;
  if (indicator.id === "unemployment") return value <= 4 ? AC.green : value <= 5.5 ? AC.yellow : AC.red;
  return AC.yellow;
}
