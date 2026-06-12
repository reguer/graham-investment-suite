import { p } from "./formatters.js";
import { detectMagnitudeWarning } from "../tools/watchlist/yahooFundamentals.js";

// Fields required to compute a meaningful Graham analysis. Missing any of these
// means the analyzer should warn (and show N/D), not silently compute over null.
const REQUIRED_FIELDS = [
  { key: "price", label: "Precio" },
  { key: "sharesOutstanding", label: "Acciones en circulación" },
  { key: "epsTTM", label: "EPS TTM" },
  { key: "equity", label: "Patrimonio" },
  { key: "currentAssets", label: "Activos corrientes" },
  { key: "currentLiabilities", label: "Pasivos corrientes" },
  { key: "totalLiabilities", label: "Pasivos totales" },
];

// Range/sign rules. Each returns a warning string when violated, or null.
const RANGE_RULES = [
  { keys: ["price"], test: (v) => v.price === null || v.price > 0, message: "El precio debe ser mayor que 0." },
  { keys: ["sharesOutstanding"], test: (v) => v.sharesOutstanding === null || v.sharesOutstanding > 0, message: "Las acciones en circulación deben ser mayores que 0." },
  { keys: ["currentLiabilities"], test: (v) => v.currentLiabilities === null || v.currentLiabilities > 0, message: "Los pasivos corrientes deben ser mayores que 0 para el ratio corriente." },
  {
    keys: ["currentAssets", "totalAssets"],
    test: (v) => v.currentAssets === null || v.totalAssets === null || v.currentAssets <= v.totalAssets,
    message: "Los activos corrientes no pueden superar a los activos totales.",
  },
  {
    keys: ["inventory", "currentAssets"],
    test: (v) => v.inventory === null || v.currentAssets === null || v.inventory <= v.currentAssets,
    message: "El inventario no puede superar a los activos corrientes.",
  },
  {
    keys: ["adrRatio"],
    test: (v) => !v.isADR || v.adrRatio === null || v.adrRatio > 0,
    message: "El ADR ratio debe ser mayor que 0 cuando la empresa es un ADR.",
  },
];

const NUMERIC_KEYS = [
  "price", "totalAssets", "currentAssets", "inventory", "totalLiabilities", "currentLiabilities",
  "equity", "intangiblesTotal", "netTangibleAssets", "sharesOutstanding", "revenue", "ebit",
  "interestExpense", "netIncome", "epsTTM", "operatingCF", "investingCF", "financingCF", "adrRatio",
];

// validateFinancials(form): non-blocking validation run before calcRatios.
// Returns { ok, missing: [{key,label}], warnings: [string] }.
// `ok` is true when no required field is missing and no range rule is violated.
export function validateFinancials(form = {}) {
  const parsed = {};
  const invalidType = [];
  for (const key of NUMERIC_KEYS) {
    const rawValue = form[key];
    const value = p(rawValue);
    parsed[key] = value;
    // A non-empty raw value that fails to parse is a type error (e.g. "abc").
    if (value === null && rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== "") {
      invalidType.push(key);
    }
  }
  parsed.isADR = Boolean(form.isADR);

  const missing = REQUIRED_FIELDS.filter(({ key }) => parsed[key] === null);

  const warnings = [];
  for (const rule of RANGE_RULES) {
    if (!rule.test(parsed)) warnings.push(rule.message);
  }
  for (const key of invalidType) {
    warnings.push(`El campo ${key} no es un número válido.`);
  }
  const magnitude = detectMagnitudeWarning({
    price: parsed.price,
    totalAssets: parsed.totalAssets,
    equity: parsed.equity,
    revenue: parsed.revenue,
    netIncome: parsed.netIncome,
  });
  if (magnitude) warnings.push(magnitude);

  return {
    ok: missing.length === 0 && warnings.length === 0,
    missing,
    warnings,
  };
}
